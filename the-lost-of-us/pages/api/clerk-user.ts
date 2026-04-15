// This is a simple Next.js API route to proxy Clerk public user info
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Ambiente local: não é possível buscar dados reais do Clerk sem API externa
  // Retorne um mock ou mensagem amigável
  res.status(200).json({
    username: `usuario_local_${userId}`,
    firstName: `Usuário Local (${userId})`,
    email: `${userId}@local.dev`
  });
}
