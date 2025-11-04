import Room from "../models/Room.js";

export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ number: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Habitación no encontrada" });
    }

    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchRooms = async (req, res) => {
  try {
    const {
      type,
      isAvailable,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
      amenities,
      sortBy = "pricePerNight",
      order = "asc",
    } = req.query;

    const filters = {};

    if (type) {
      filters.type = type;
    }

    if (isAvailable !== undefined) {
      filters.isAvailable = isAvailable === "true";
    }

    if (minCapacity || maxCapacity) {
      filters.capacity = {};
      if (minCapacity) {
        filters.capacity.$gte = Number(minCapacity);
      }
      if (maxCapacity) {
        filters.capacity.$lte = Number(maxCapacity);
      }
    }

    if (minPrice || maxPrice) {
      filters.pricePerNight = {};
      if (minPrice) {
        filters.pricePerNight.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filters.pricePerNight.$lte = Number(maxPrice);
      }
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",").map((item) => item.trim());

      if (amenitiesList.length > 0) {
        filters.amenities = { $all: amenitiesList };
      }
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const allowedSortFields = ["pricePerNight", "capacity", "number", "type"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "pricePerNight";

    const rooms = await Room.find(filters).sort({ [sortField]: sortOrder });

    res.status(200).json({ count: rooms.length, results: rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRoomAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      return res
        .status(400)
        .json({ message: "El campo 'isAvailable' debe ser booleano." });
    }

    const room = await Room.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Habitación no encontrada" });
    }

    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);

    if (!room) {
      return res.status(404).json({ error: "Habitación no encontrada" });
    }

    res
      .status(200)
      .json({ message: "Habitación eliminada correctamente", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
