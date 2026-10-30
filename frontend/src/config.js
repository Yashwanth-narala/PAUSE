
import {
  Image as ImageIcon,
  Mail,
  Link2,
  FileText,
  MessageSquareText,
  Mic,
} from "lucide-react";
export const API =
  (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export const samples = [
  [
    "Job offer",
    "Congratulations! You have been selected for a work-from-home job. Pay ₹2,499 as a registration fee within 2 hours to confirm your position.",
  ],
  [
    "Delivery payment",
    "Your parcel could not be delivered. Pay ₹25 using this link to reschedule your delivery today.",
  ],
  [
    "Account alert",
    "Your account will be suspended today. Click this link immediately to verify your account and avoid suspension.",
  ],
  [
    "Legitimate example",
    "Your monthly statement is ready. Sign in to your bank's official app using your usual method to view it. We will never ask you to share your OTP or password.",
  ],
];

export const inputTypes = [
  {
    id: "message",
    title: "Message",
    description: "SMS, WhatsApp, chat, or copied text",
    icon: MessageSquareText,
    available: true,
    label: "AVAILABLE NOW",
    color: "blue",
  },
  {
    id: "screenshot",
    title: "Screenshot",
    description: "A screenshot of a message or conversation",
    icon: ImageIcon,
    available: true,
    label: "AVAILABLE NOW",
    color: "cyan",
  },
  {
    id: "email",
    title: "Email",
    description: "Email text or a suspicious email",
    icon: Mail,
    available: true,
    label: "AVAILABLE NOW",
    color: "orange",
  },
  {
    id: "url",
    title: "URL",
    description: "A website address you want to inspect",
    icon: Link2,
    available: true,
    label: "AVAILABLE NOW",
    color: "green",
  },
  {
    id: "document",
    title: "Document",
    description: "A supported document containing a claim or request",
    icon: FileText,
    available: true,
    label: "AVAILABLE NOW",
    color: "cyan",
  },
  {
    id: "voice",
    title: "VoiceGuard",
    description: "Analyze recorded calls for potential scam indicators",
    icon: Mic,
    available: true,
    label: "BETA",
    color: "orange",
  },
];
