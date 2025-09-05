"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown } from "react-icons/fa";
import {
  XMarkIcon,
  UserGroupIcon,
  UserPlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon,
  CalendarIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/components/layout/ToastContext";
import { useMediaFullView } from "@/components/layout/mediaFullViewContext";
import dateFormatter from "@/functions/dateFormattor";

// Fix: Avoid using &nbsp;, &amp;, &apos;, &quot;, &lt;, &gt; or any other unescaped HTML entities in JSX.
// Also, ensure all text content is plain text or properly escaped.

export default function LinksTab({ links }) {
  if (!Array.isArray(links) || links.length === 0) {
    return (
      <div className="text-center py-12">
        <LinkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No links shared yet</h3>
        <p className="text-gray-500">
          When group members share links, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Shared Links</h3>
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {link.title || "Link"}
                </div>
                <div className="text-xs text-blue-600 truncate mb-2">
                  {link.url}
                </div>
                {link.description && (
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {link.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Shared by{" "}
                  {link.sharedBy && link.sharedBy.name
                    ? link.sharedBy.name
                    : "Unknown"}{" "}
                  &bull;{" "}
                  {link.createdAt
                    ? dateFormatter(new Date(link.createdAt))
                    : ""}
                </div>
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}