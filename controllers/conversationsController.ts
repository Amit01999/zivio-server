import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service.js';

export async function getConversationsHandler(req: any, res: Response) {
  try {
    const conversations = await storage.getConversations(req.userId!);
    res.json({ data: conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

export async function getMessagesHandler(req: any, res: Response) {
  try {
    const messages = await storage.getMessages(req.params.id);
    res.json({ data: messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function postMessageHandler(req: any, res: Response) {
  try {
    const { text, toUserId } = req.body;
    const message = await storage.createMessage({
      fromUserId: req.userId!,
      toUserId,
      text,
      listingId: null,
      attachments: null,
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
}
