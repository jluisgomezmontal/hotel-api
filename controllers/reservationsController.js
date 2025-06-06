// controllers/reservationController.js
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";

export const createReservation = async (req, res) => {
  try {
    const { roomNumber, guestName, guestEmail, guestPhone, checkIn, checkOut } =
      req.body;

    // Validación básica
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res
        .status(400)
        .json({ message: "Fechas de entrada y salida inválidas." });
    }

    // Verifica que la habitación exista
    const room = await Room.findOne({ number: roomNumber });
    if (!room) {
      return res.status(404).json({ message: "La habitación no existe." });
    }

    // Verifica disponibilidad para ese rango de fechas
    const overlappingReservation = await Reservation.findOne({
      roomNumber,
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) },
        },
      ],
      status: { $in: ["pending", "confirmed"] },
    });

    if (overlappingReservation) {
      return res
        .status(409)
        .json({ message: "La habitación ya está reservada en esas fechas." });
    }

    // Crear la reservación
    const reservation = new Reservation({
      roomNumber,
      guestName,
      guestEmail,
      guestPhone,
      checkIn,
      checkOut,
      status: "pending",
    });

    await reservation.save();

    return res
      .status(201)
      .json({ message: "Reservación creada exitosamente", reservation });
  } catch (error) {
    console.error("Error al crear reservación:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    reservation.status = status;
    await reservation.save();

    return res.status(200).json({
      message: "Estado de la reservación actualizado correctamente.",
      reservation,
    });
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getAvailableRooms = async (req, res) => {
  try {
    const now = new Date();

    // Establece el inicio del día (hoy a las 00:00)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Establece el final del día (hoy a las 23:59:59.999)
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Buscar reservaciones que estén activas en cualquier momento del día de hoy
    const overlappingReservations = await Reservation.find({
      checkIn: { $lt: todayEnd },
      checkOut: { $gt: todayStart },
      status: { $in: ["pending", "confirmed"] },
    });

    const reservedRoomNumbers = overlappingReservations.map(
      (r) => r.roomNumber
    );

    const reservedRooms = overlappingReservations;

    const availableRooms = await Room.find({
      number: { $nin: reservedRoomNumbers },
    });

    return res.status(200).json({ availableRooms, reservedRooms });
  } catch (error) {
    console.error("Error al obtener habitaciones disponibles:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const allRooms = await Room.find();

    return res.status(200).json({ allRooms });
  } catch (error) {
    console.error("Error al obtener habitaciones disponibles:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};
export const getReservationsByRoom = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const reservations = await Reservation.find({ roomNumber }).sort({
      checkIn: 1,
    });
    return res.status(200).json({ reservations });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
