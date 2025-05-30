import { Request, Response } from "express";
import { db } from "../config/db";

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: "primary" | "secondary";
  createdAt: string; 
  updatedAt: string;
  deletedAt: string | null;
}

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;
  if (!email && !phoneNumber)
    return res.status(400).json({ error: "Email or phoneNumber is required" });

  try {
    const [existingContacts]: any[] = await db.query(
      `SELECT * FROM Contact WHERE email = ? OR phoneNumber = ?`,
      [email, phoneNumber]
    );

    const allContactIds = new Set<number>();
    const allEmails = new Set<string>();
    const allPhones = new Set<string>();

    let primary: any = null;

    // Find earliest created primary contact
    for (const contact of existingContacts) {
      if (contact.linkPrecedence === "primary") {
        if (!primary || contact.createdAt < primary.createdAt) {
          primary = contact;
        }
      }
    }

    if (!primary && existingContacts.length > 0) {
      primary = existingContacts[0];
    }

    if (!primary) {
      // No related contact found → create new primary
      const [result]: any = await db.query(
        `INSERT INTO Contact (email, phoneNumber, linkPrecedence) VALUES (?, ?, 'primary')`,
        [email, phoneNumber]
      );
      return res.status(200).json({
        contact: {
          primaryContactId: result.insertId,
          emails: [email],
          phoneNumbers: [phoneNumber],
          secondaryContactIds: [],
        },
      });
    }

    // Add info to sets
    existingContacts.forEach((c:Contact) => {
      if (c.email) allEmails.add(c.email);
      if (c.phoneNumber) allPhones.add(c.phoneNumber);
      if (c.id !== primary.id) allContactIds.add(c.id);
    });
    if (primary.email) allEmails.add(primary.email);
    if (primary.phoneNumber) allPhones.add(primary.phoneNumber);

    const isNew = !existingContacts.some(
      (c:Contact) => c.email === email && c.phoneNumber === phoneNumber
    );

    // If new combination, insert as secondary
    if (isNew) {
      const [inserted]: any = await db.query(
        `INSERT INTO Contact (email, phoneNumber, linkPrecedence, linkedId) VALUES (?, ?, 'secondary', ?)`,
        [email, phoneNumber, primary.id]
      );
      allContactIds.add(inserted.insertId);
      if (email) allEmails.add(email);
      if (phoneNumber) allPhones.add(phoneNumber);
    }

    return res.status(200).json({
      contact: {
        primaryContactId: primary.id,
        emails: Array.from(allEmails),
        phoneNumbers: Array.from(allPhones),
        secondaryContactIds: Array.from(allContactIds),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

