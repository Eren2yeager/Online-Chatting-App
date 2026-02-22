'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  XMarkIcon,
  UserPlusIcon,
  QrCodeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Modal, ModalBody, Button, Input } from "@/components/ui";
import { useSocketEmitter } from "@/lib/socket";
import { useToast } from "@/components/layout/ToastContext";
import { useRouter } from "next/navigation";

/**
 * Add Friend Modal with Manual and QR Scanner options
 */
export default function AddFriendModal({ isOpen, onClose, onFriendAdded }) {
  const { emitAck } = useSocketEmitter();
  const toast = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("manual"); // 'manual' or 'qr'
  const [loading, setLoading] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [invalidQR, setInvalidQR] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const [formData, setFormData] = useState({
    handle: "",
    message: "",
  });

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!formData.handle.trim()) {
      toast({ text: "Please enter a handle" });
      return;
    }

    try {
      setLoading(true);
      const res = await emitAck("friend:request:create", {
        handle: formData.handle.replace("@", ""),
        message: formData.message,
      });

      if (res?.success) {
        toast({ text: "Friend request sent successfully!" });
        setFormData({ handle: "", message: "" });
        onFriendAdded?.();
        onClose();
      } else {
        toast({ text: res?.error || "Failed to send friend request" });
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ text: "Failed to send friend request" });
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (result) => {
    if (result && result[0]?.rawValue) {
      const scannedData = result[0].rawValue;
      console.log("QR Code scanned:", scannedData);

      // Check if it's a profile URL
      if (scannedData.includes("/profile/")) {
        const handle = scannedData.split("/profile/")[1];
        if (handle) {
          toast({ text: `Navigating to @${handle}'s profile` });
          onClose();
          router.push(`/profile/${handle}`);
        }
      } else {
        // Invalid QR code - stop scanner and show error
        setScannerActive(false);
        setInvalidQR(true);
      }
    }
  };

  const handleQRError = (error) => {
    console.error("QR Scanner error:", error);
    setScannerActive(false);

    if (error.name === "NotAllowedError") {
      setScannerError({
        type: "permission",
        message:
          "Camera permission denied. Please enable camera access in your browser settings.",
      });
    } else if (error.name === "NotFoundError") {
      setScannerError({
        type: "notfound",
        message: "No camera found on this device.",
      });
    } else {
      setScannerError({
        type: "error",
        message: "Error accessing camera: " + error.message,
      });
    }
  };

  const handleRetryScan = () => {
    setInvalidQR(false);
    setScannerError(null);
    setScannerActive(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
      <ModalBody>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Friend</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "manual"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <UserPlusIcon className="w-5 h-5" />
            Manual Add
          </button>
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === "qr"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <QrCodeIcon className="w-5 h-5" />
            Scan QR
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "manual" ? (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleManualAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Friend's Handle
                  </label>
                  <Input
                    type="text"
                    value={formData.handle}
                    onChange={(e) =>
                      setFormData({ ...formData, handle: e.target.value })
                    }
                    placeholder="@username"
                    icon={<MagnifyingGlassIcon className="w-5 h-5" />}
                    iconPosition="left"
                    required
                    className="text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Add a personal message..."
                    rows="3"
                    maxLength="200"
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.message.length}/200 characters
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Request"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {/* Instructions */}
                {!scannerError && !invalidQR && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700 text-center font-medium">
                      📷 Scan a friend's profile QR code to visit their profile
                    </p>
                    <p className="text-xs text-blue-600 text-center mt-1">
                      Allow camera access when prompted by your browser
                    </p>
                  </div>
                )}

                {/* Scanner Error */}
                {scannerError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XMarkIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Camera Access Error
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      {scannerError.message}
                    </p>
                    {scannerError.type === "permission" && (
                      <p className="text-xs text-red-600 mb-4">
                        Click the camera icon in your browser's address bar or
                        check browser settings.
                      </p>
                    )}
                    <Button
                      variant="primary"
                      onClick={handleRetryScan}
                      className="mx-auto"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Invalid QR Code */}
                {invalidQR && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCodeIcon className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Invalid QR Code
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      This QR code is not a valid profile QR code. Please scan
                      a profile QR code from the app.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleRetryScan}
                      className="mx-auto"
                    >
                      Scan Again
                    </Button>
                  </div>
                )}

                {/* Scanner */}
                {scannerActive && !scannerError && !invalidQR && (
                  <>
                    <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-black shadow-lg">
                      <Scanner
                        onScan={handleQRScan}
                        onError={handleQRError}
                        constraints={{
                          facingMode: "environment",
                        }}
                        styles={{
                          container: {
                            width: "100%",
                            height: "100%",
                          },
                          video: {
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          },
                        }}
                      />

                      {/* Scanning overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-2 border-white opacity-30 m-12 rounded-lg"></div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">
                        Position the QR code within the frame
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        The scan will happen automatically
                      </p>
                    </div>
                  </>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-full mt-4"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalBody>
    </Modal>
  );
}
