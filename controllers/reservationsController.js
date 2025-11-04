// controllers/reservationsController.js
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import Guest from "../models/Guest.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const buildGuestDisplayName = (guest) =>
  [guest.firstName, guest.lastName].filter(Boolean).join(" ").trim();

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ensureValidDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return false;
  return checkOut.getTime() > checkIn.getTime();
};

const calculateNights = (checkIn, checkOut) => {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / MS_PER_DAY);
};

export const createReservation = async (req, res) => {
  try {
    const {
      roomNumber,
      numberOfGuests,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      notes,
      guestId,
      guest: guestPayload,
    } = req.body;

    const checkInDate = parseDate(checkIn);
    const checkOutDate = parseDate(checkOut);

    if (!ensureValidDateRange(checkInDate, checkOutDate)) {
      return res
        .status(400)
        .json({ message: "Fechas de entrada y salida inválidas." });
    }

    const room = await Room.findOne({ number: roomNumber });
    if (!room) {
      return res.status(404).json({ message: "La habitación no existe." });
    }

    const parsedNumberOfGuests = Number(
      numberOfGuests !== undefined && numberOfGuests !== null ? numberOfGuests : 1
    );
    if (!Number.isFinite(parsedNumberOfGuests) || parsedNumberOfGuests < 1) {
      return res.status(400).json({ message: "El número de huéspedes debe ser válido y mayor a cero." });
    }
    if (parsedNumberOfGuests > room.capacity) {
      return res
        .status(400)
        .json({ message: `La habitación seleccionada admite máximo ${room.capacity} huésped(es).` });
    }

    const overlappingReservation = await Reservation.findOne({
      roomNumber,
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      status: { $in: ["pending", "confirmed"] },
    });

    if (overlappingReservation) {
      return res
        .status(409)
        .json({ message: "La habitación ya está reservada en esas fechas." });
    }

    let guestDocument = null;

    if (guestId) {
      guestDocument = await Guest.findById(guestId);
      if (!guestDocument) {
        return res
          .status(404)
          .json({ message: "El huésped proporcionado no existe." });
      }
    } else if (guestPayload) {
      const {
        firstName,
        lastName,
        email,
        phone,
        documentType,
        documentNumber,
        notes: guestNotes,
      } = guestPayload;

      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({
          message:
            "Para crear un huésped se requieren firstName, lastName, email y phone.",
        });
      }

      const normalizedEmail = normalizeEmail(email);
      guestDocument = await Guest.findOne({ email: normalizedEmail });

      if (guestDocument) {
        const updates = {};
        if (guestDocument.phone !== phone) updates.phone = phone;
        if (guestDocument.documentType !== documentType && documentType) {
          updates.documentType = documentType;
        }
        if (guestDocument.documentNumber !== documentNumber && documentNumber) {
          updates.documentNumber = documentNumber;
        }
        if (guestNotes && guestDocument.notes !== guestNotes) {
          updates.notes = guestNotes;
        }

        if (Object.keys(updates).length > 0) {
          guestDocument.set(updates);
          await guestDocument.save();
        }
      } else {
        guestDocument = await Guest.create({
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          documentType,
          documentNumber,
          notes: guestNotes ?? "",
        });
      }
    }

    const contactName = guestDocument
      ? buildGuestDisplayName(guestDocument)
      : guestName;
    const contactEmail = guestDocument?.email ?? guestEmail;
    const contactPhone = guestDocument?.phone ?? guestPhone;

    if (!contactName || !contactEmail || !contactPhone) {
      return res.status(400).json({
        message:
          "Se requiere la información de contacto del huésped (nombre, email y teléfono).",
      });
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    const totalPrice = nights * room.pricePerNight;

    const reservation = await Reservation.create({
      guest: guestDocument?._id,
      roomNumber,
      guestName: contactName,
      guestEmail: contactEmail,
      guestPhone: contactPhone,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfGuests: parsedNumberOfGuests,
      totalPrice,
      totalPaid: 0,
      balanceDue: totalPrice,
      notes: notes ?? "",
      status: "pending",
    });

    return res.status(201).json({
      message: "Reservación creada exitosamente",
      reservation,
    });
  } catch (error) {
    console.error("Error al crear reservación:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const {
      roomNumber,
      numberOfGuests,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      notes,
      guestId,
      guest: guestPayload,
    } = req.body;
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    let targetRoomNumber = reservation.roomNumber;
    if (roomNumber !== undefined) {
      const parsedRoomNumber = Number(roomNumber);
      if (Number.isNaN(parsedRoomNumber)) {
        return res
          .status(400)
          .json({ message: "El número de habitación debe ser numérico." });
      }
      targetRoomNumber = parsedRoomNumber;
    }

    const room = await Room.findOne({ number: targetRoomNumber });
    if (!room) {
      return res.status(404).json({ message: "La habitación no existe." });
    }

    let targetNumberOfGuests = reservation.numberOfGuests ?? 1;
    if (numberOfGuests !== undefined) {
      const parsedNumberOfGuests = Number(numberOfGuests);
      if (!Number.isFinite(parsedNumberOfGuests) || parsedNumberOfGuests < 1) {
        return res.status(400).json({ message: "El número de huéspedes debe ser válido y mayor a cero." });
      }
      targetNumberOfGuests = parsedNumberOfGuests;
    }

    if (targetNumberOfGuests > room.capacity) {
      return res
        .status(400)
        .json({ message: `La habitación seleccionada admite máximo ${room.capacity} huésped(es).` });
    }

    const checkInDate =
      checkIn !== undefined ? parseDate(checkIn) : new Date(reservation.checkIn);
    const checkOutDate =
      checkOut !== undefined ? parseDate(checkOut) : new Date(reservation.checkOut);

    if ((checkIn !== undefined && !checkInDate) || (checkOut !== undefined && !checkOutDate)) {
      return res
        .status(400)
        .json({ message: "Fechas de entrada y salida inválidas." });
    }

    if (!ensureValidDateRange(checkInDate, checkOutDate)) {
      return res
        .status(400)
        .json({ message: "El rango de fechas debe ser válido." });
    }

    const overlappingReservation = await Reservation.findOne({
      _id: { $ne: id },
      roomNumber: targetRoomNumber,
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
      status: { $in: ["pending", "confirmed"] },
    });

    if (overlappingReservation) {
      return res
        .status(409)
        .json({ message: "La habitación ya está reservada en esas fechas." });
    }

    let guestDocument = null;

    if (guestId) {
      guestDocument = await Guest.findById(guestId);
      if (!guestDocument) {
        return res
          .status(404)
          .json({ message: "El huésped proporcionado no existe." });
      }
    } else if (guestPayload) {
      const {
        firstName,
        lastName,
        email,
        phone,
        documentType,
        documentNumber,
        notes: guestNotes,
      } = guestPayload;

      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({
          message:
            "Para crear un huésped se requieren firstName, lastName, email y phone.",
        });
      }

      const normalizedEmail = normalizeEmail(email);
      guestDocument = await Guest.findOne({ email: normalizedEmail });

      if (guestDocument) {
        const updates = {};
        if (guestDocument.phone !== phone) updates.phone = phone;
        if (guestDocument.documentType !== documentType && documentType) {
          updates.documentType = documentType;
        }
        if (guestDocument.documentNumber !== documentNumber && documentNumber) {
          updates.documentNumber = documentNumber;
        }
        if (guestNotes && guestDocument.notes !== guestNotes) {
          updates.notes = guestNotes;
        }

        if (Object.keys(updates).length > 0) {
          guestDocument.set(updates);
          await guestDocument.save();
        }
      } else {
        guestDocument = await Guest.create({
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          documentType,
          documentNumber,
          notes: guestNotes ?? "",
        });
      }
    } else if (reservation.guest) {
      guestDocument = await Guest.findById(reservation.guest);
    }

    const contactName =
      guestName ??
      (guestDocument ? buildGuestDisplayName(guestDocument) : reservation.guestName);
    const contactEmail =
      guestEmail ?? guestDocument?.email ?? reservation.guestEmail;
    const contactPhone =
      guestPhone ?? guestDocument?.phone ?? reservation.guestPhone;

    if (!contactName || !contactEmail || !contactPhone) {
      return res.status(400).json({
        message:
          "Se requiere la información de contacto del huésped (nombre, email y teléfono).",
      });
    }

    const nights = calculateNights(checkInDate, checkOutDate);
    const totalPrice = nights * room.pricePerNight;
    const totalPaid = reservation.totalPaid ?? 0;
    const balanceDue = Math.max(totalPrice - totalPaid, 0);

    reservation.roomNumber = targetRoomNumber;
    if (guestDocument) {
      reservation.guest = guestDocument._id;
    }
    reservation.guestName = contactName;
    reservation.guestEmail = contactEmail;
    reservation.guestPhone = contactPhone;
    reservation.checkIn = checkInDate;
    reservation.checkOut = checkOutDate;
    reservation.numberOfGuests = targetNumberOfGuests;
    reservation.totalPrice = totalPrice;
    reservation.balanceDue = balanceDue;
    if (notes !== undefined) {
      reservation.notes = notes ?? "";
    }

    await reservation.save();
    await reservation.populate({
      path: "guest",
      select: "firstName lastName email phone documentType documentNumber",
    });

    return res.status(200).json({
      message: "Reservación actualizada correctamente.",
      reservation,
    });
  } catch (error) {
    console.error("Error al actualizar reservación:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "checked-in",
      "checked-out",
      "cancelled",
      "completed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    if (reservation.status === status) {
      return res.status(200).json({
        message: "Reservación actualizada correctamente.",
        reservation,
      });
    }

    reservation.status = status;
    await reservation.save();

    const blockingStatuses = ["confirmed", "checked-in"];
    const roomNumber = reservation.roomNumber;

    if (roomNumber !== undefined && roomNumber !== null) {
      const room = await Room.findOne({ number: roomNumber });

      if (room) {
        if (blockingStatuses.includes(status)) {
          if (room.isAvailable) {
            room.isAvailable = false;
            await room.save();
          }
        } else {
          const otherBlockingReservationExists = await Reservation.exists({
            _id: { $ne: reservation._id },
            roomNumber,
            status: { $in: blockingStatuses },
          });

          if (!otherBlockingReservationExists && room.isAvailable !== true) {
            room.isAvailable = true;
            await room.save();
          }
        }
      }
    }

    await reservation.populate({
      path: "guest",
      select: "firstName lastName email phone documentType documentNumber",
    });

    return res.status(200).json({
      message: "Estado de la reservación actualizado correctamente.",
      reservation,
    });
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getReservations = async (req, res) => {
  try {
    const {
      status,
      roomNumber,
      guestEmail,
      guestId,
      startDate,
      endDate,
      sortBy = "checkIn",
      order = "asc",
    } = req.query;

    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (roomNumber) {
      filters.roomNumber = Number(roomNumber);
    }

    if (guestEmail) {
      filters.guestEmail = { $regex: guestEmail, $options: "i" };
    }

    if (guestId) {
      filters.guest = guestId;
    }

    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate) : null;

    if ((startDate && !start) || (endDate && !end)) {
      return res
        .status(400)
        .json({ message: "Rango de fechas inválido para la búsqueda." });
    }

    if (start || end) {
      filters.$and = [];
      if (start) {
        filters.$and.push({ checkOut: { $gt: start } });
      }
      if (end) {
        filters.$and.push({ checkIn: { $lt: end } });
      }
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const allowedSortFields = ["checkIn", "checkOut", "totalPrice", "status"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "checkIn";

    const reservations = await Reservation.find(filters)
      .sort({
        [sortField]: sortOrder,
      })
      .populate({
        path: "guest",
        select: "firstName lastName email phone documentType documentNumber",
      });

    return res.status(200).json({ count: reservations.length, results: reservations });
  } catch (error) {
    console.error("Error al listar reservaciones:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id).populate({
      path: "guest",
      select: "firstName lastName email phone documentType documentNumber",
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    return res.status(200).json(reservation);
  } catch (error) {
    console.error("Error al obtener reservación:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getAvailableRooms = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? parseDate(startDate) : new Date();
    const end = endDate ? parseDate(endDate) : null;

    if (!start) {
      return res
        .status(400)
        .json({ message: "La fecha de inicio proporcionada no es válida." });
    }

    let effectiveEnd = end;
    if (!effectiveEnd) {
      effectiveEnd = new Date(start);
      effectiveEnd.setDate(effectiveEnd.getDate() + 1);
    }

    if (!ensureValidDateRange(start, effectiveEnd)) {
      return res
        .status(400)
        .json({ message: "El rango de fechas debe ser de al menos una noche." });
    }

    const overlappingReservations = await Reservation.find({
      checkIn: { $lt: effectiveEnd },
      checkOut: { $gt: start },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ checkIn: 1 })
      .populate({
        path: "guest",
        select: "firstName lastName email phone documentType documentNumber",
      });

    const reservedRoomNumbers = overlappingReservations.map(
      (reservation) => reservation.roomNumber
    );

    const availableRooms = await Room.find({
      number: { $nin: reservedRoomNumbers },
      isAvailable: true,
    }).sort({ number: 1 });

    return res.status(200).json({
      range: {
        start: start.toISOString(),
        end: effectiveEnd.toISOString(),
      },
      availableRooms,
      reservedRooms: overlappingReservations,
    });
  } catch (error) {
    console.error("Error al obtener habitaciones disponibles:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getRoomsOverview = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
    const activeReservations = await Reservation.find({
      checkOut: { $gte: new Date() },
      status: { $in: ["pending", "confirmed"] },
    })
      .sort({ checkIn: 1 })
      .populate({
        path: "guest",
        select: "firstName lastName email phone documentType documentNumber",
      });

    const reservationsByRoom = activeReservations.reduce((acc, reservation) => {
      if (!acc[reservation.roomNumber]) {
        acc[reservation.roomNumber] = [];
      }
      acc[reservation.roomNumber].push(reservation);
      return acc;
    }, {});

    const summary = rooms.map((room) => ({
      room,
      upcomingReservations: reservationsByRoom[room.number] ?? [],
    }));

    return res.status(200).json({ count: summary.length, results: summary });
  } catch (error) {
    console.error("Error al obtener habitaciones:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getReservationsByRoom = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { upcomingOnly } = req.query;

    const filters = { roomNumber: Number(roomNumber) };

    if (Number.isNaN(filters.roomNumber)) {
      return res
        .status(400)
        .json({ message: "El número de habitación debe ser numérico." });
    }

    if (upcomingOnly === "true") {
      filters.checkOut = { $gte: new Date() };
    }

    const reservations = await Reservation.find(filters)
      .sort({ checkIn: 1 })
      .populate({
        path: "guest",
        select: "firstName lastName email phone documentType documentNumber",
      });
    return res.status(200).json({ count: reservations.length, results: reservations });
  } catch (error) {
    console.error("Error al obtener reservaciones por habitación:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
