'use client';

import { motion } from "framer-motion";
import { LinkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import dateFormatter from "@/functions/dateFormattor";

export default function LinksTab({ links }) {
  const router = useRouter();

  if (!Array.isArray(links) || links.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
          <LinkIcon className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No links shared yet
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          When group members share links, they will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Shared Links
      </h3>
      
      <div className="space-y-3">
        {links.map((link, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all bg-white cursor-pointer"
            onClick={() => router.push(link.url)}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <LinkIcon className="h-6 w-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {link.title || "Link"}
                  </h4>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
                
                <div className="text-xs text-blue-600 truncate mb-2 hover:underline">
                  {link.url}
                </div>
                
                {link.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {link.description}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>
                    Shared by{" "}
                    <span className="font-medium text-gray-600">
                      {link.sharedBy && link.sharedBy.name
                        ? link.sharedBy.name
                        : "Unknown"}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    {link.createdAt
                      ? dateFormatter(new Date(link.createdAt))
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
