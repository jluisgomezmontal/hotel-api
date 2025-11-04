import Guest from "../models/Guest.js";

const parsePagination = (value, defaultValue) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;
  return parsed;
};

export const createGuest = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, documentType, documentNumber, notes } =
      req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        message: "Los campos firstName, lastName, email y phone son obligatorios.",
      });
    }

    const existingGuest = await Guest.findOne({ email });
    if (existingGuest) {
      return res.status(409).json({ message: "El correo electrónico ya está registrado." });
    }

    const guest = await Guest.create({
      firstName,
      lastName,
      email,
      phone,
      documentType,
      documentNumber,
      notes,
    });

    return res.status(201).json({ message: "Huésped registrado correctamente", guest });
  } catch (error) {
    console.error("Error al registrar huésped:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getGuests = async (req, res) => {
  try {
    const {
      search,
      documentType,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filters = {};

    if (documentType) {
      filters.documentType = documentType;
    }

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filters.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const pageNumber = parsePagination(page, 1);
    const pageSize = parsePagination(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const sortOrder = order === "asc" ? 1 : -1;
    const allowedSort = ["createdAt", "firstName", "lastName", "email"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    const [guests, total] = await Promise.all([
      Guest.find(filters)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pageSize),
      Guest.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.status(200).json({
      count: guests.length,
      total,
      page: pageNumber,
      totalPages,
      results: guests,
    });
  } catch (error) {
    console.error("Error al obtener huéspedes:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const getGuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id);

    if (!guest) {
      return res.status(404).json({ message: "Huésped no encontrado." });
    }

    return res.status(200).json(guest);
  } catch (error) {
    console.error("Error al obtener huésped:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (email) {
      const existingGuest = await Guest.findOne({ email, _id: { $ne: id } });
      if (existingGuest) {
        return res
          .status(409)
          .json({ message: "El correo electrónico ya está registrado en otro huésped." });
      }
    }

    const guest = await Guest.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!guest) {
      return res.status(404).json({ message: "Huésped no encontrado." });
    }

    return res.status(200).json({ message: "Huésped actualizado correctamente", guest });
  } catch (error) {
    console.error("Error al actualizar huésped:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};

export const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findByIdAndDelete(id);

    if (!guest) {
      return res.status(404).json({ message: "Huésped no encontrado." });
    }

    return res.status(200).json({ message: "Huésped eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar huésped:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};
