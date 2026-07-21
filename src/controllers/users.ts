import type { RequestHandler } from 'express';

const users = [
  { id: 1, username: 'luna', followers: 120 },
  { id: 2, username: 'nova', followers: 340 },
];

const getUsers: RequestHandler = (req, res) => {
  res.status(200).json({ success: true, data: users, error: null });
};

const getUserById: RequestHandler = (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new Error(`"${req.params.id}" is not a valid user ID`);
  }

  const user = users.find((u) => u.id === id) ?? null;

  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }

  res.status(200).json({ success: true, data: user, error: null });
};

const createUser: RequestHandler = (req, res) => {
  const { name, email } = req.body as { name: string; email: string };
  res
    .status(201)
    .json({ success: true, data: { id: 3, name, email }, error: null });
};

export { getUsers, getUserById, createUser };
