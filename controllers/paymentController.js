import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";

const ALLOWED_METHODS = ["efectivo", "tdd", "tdc"];

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parsePagination = (value, defaultValue) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;
  return parsed;
};

export const registerPayment = async (req, res) => {
  try {
    const {
      reservationId,
      amount,
      method,
      reference,
      notes,
      paidAt,
      recordedBy,
    } = req.body;

    if (!reservationId) {
      return res.status(400).json({ message: "El campo reservationId es obligatorio." });
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: "El monto del pago debe ser un número mayor a cero." });
    }

    const normalizedMethod = method?.toLowerCase();
    if (!normalizedMethod || !ALLOWED_METHODS.includes(normalizedMethod)) {
      return res.status(400).json({
        message: "El método de pago debe ser uno de: efectivo, tdd, tdc.",
      });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    if (reservation.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "No se pueden registrar pagos para reservaciones canceladas." });
    }

    if (reservation.balanceDue !== undefined && amount > reservation.balanceDue) {
      return res.status(400).json({
        message: `El monto del pago excede el saldo pendiente (${reservation.balanceDue}).`,
      });
    }

    const paymentDate = paidAt ? parseDate(paidAt) : new Date();
    if (paidAt && !paymentDate) {
      return res
        .status(400)
        .json({ message: "La fecha del pago proporcionada no es válida." });
    }

    const payment = await Payment.create({
      reservation: reservation._id,
      guest: reservation.guest,
      amount,
      method: normalizedMethod,
      reference: reference ?? "",
      notes: notes ?? "",
      paidAt: paymentDate,
      recordedBy: recordedBy ?? "",
    });

    reservation.totalPaid = Number(reservation.totalPaid ?? 0) + amount;
    reservation.balanceDue = Math.max(
      reservation.totalPrice - reservation.totalPaid,
      0
    );

    if (reservation.balanceDue === 0 && reservation.status === "pending") {
      reservation.status = "confirmed";
    }

    await reservation.save();

    const populatedPayment = await payment.populate([
      {
        path: "reservation",
        select:
          "roomNumber guestName guestEmail guestPhone totalPrice totalPaid balanceDue status checkIn checkOut",
      },
      {
        path: "guest",
        select: "firstName lastName email phone documentType documentNumber",
      },
    ]);

    return res.status(201).json({
      message: "Pago registrado correctamente",
      payment: populatedPayment,
      reservation,
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getPayments = async (req, res) => {
  try {
    const {
      reservationId,
      guestId,
      method,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      order = "desc",
    } = req.query;

    const filters = {};

    if (reservationId) {
      filters.reservation = reservationId;
    }

    if (guestId) {
      filters.guest = guestId;
    }

    if (method) {
      const normalizedMethod = method.toLowerCase();
      if (!ALLOWED_METHODS.includes(normalizedMethod)) {
        return res.status(400).json({
          message: "Método de pago inválido. Use: efectivo, tdd, tdc.",
        });
      }
      filters.method = normalizedMethod;
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (startDate && !start) {
      return res.status(400).json({ message: "startDate inválida." });
    }

    if (endDate && !end) {
      return res.status(400).json({ message: "endDate inválida." });
    }

    if (start || end) {
      filters.paidAt = {};
      if (start) {
        filters.paidAt.$gte = start;
      }
      if (end) {
        filters.paidAt.$lte = end;
      }
    }

    const pageNumber = parsePagination(page, 1);
    const pageSize = parsePagination(limit, 20);
    const skip = (pageNumber - 1) * pageSize;
    const sortOrder = order === "asc" ? 1 : -1;

    const [payments, total, amountAggregation] = await Promise.all([
      Payment.find(filters)
        .sort({ paidAt: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .populate([
          {
            path: "reservation",
            select:
              "roomNumber guestName guestEmail guestPhone totalPrice totalPaid balanceDue status",
          },
          {
            path: "guest",
            select: "firstName lastName email phone",
          },
        ]),
      Payment.countDocuments(filters),
      Payment.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totalAmount = amountAggregation[0]?.totalAmount ?? 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.status(200).json({
      count: payments.length,
      total,
      totalPages,
      page: pageNumber,
      totalAmount,
      results: payments,
    });
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate([
      {
        path: "reservation",
        select:
          "roomNumber guestName guestEmail guestPhone totalPrice totalPaid balanceDue status createdAt updatedAt",
      },
      {
        path: "guest",
        select: "firstName lastName email phone documentType documentNumber",
      },
    ]);

    if (!payment) {
      return res.status(404).json({ message: "Pago no encontrado." });
    }
    return res.status(200).json(payment);
  } catch (error) {
    console.error("Error al obtener pago:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getPaymentsByReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (!reservationId) {
      return res
        .status(400)
        .json({ message: "El parámetro reservationId es obligatorio." });
    }

    const payments = await Payment.find({ reservation: reservationId })
      .sort({ paidAt: -1 })
      .populate([
        {
          path: "reservation",
          select:
            "roomNumber guestName guestEmail guestPhone totalPrice totalPaid balanceDue status",
        },
        {
          path: "guest",
          select: "firstName lastName email phone",
        },
      ]);

    const totalAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);

    return res.status(200).json({
      count: payments.length,
      totalAmount,
      results: payments,
    });
  } catch (error) {
    console.error("Error al obtener pagos por reservación:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};
