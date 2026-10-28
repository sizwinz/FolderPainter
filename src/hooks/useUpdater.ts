import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateStatus {
  state: "idle" | "checking" | "available" | "downloading" | "upToDate" | "error";
  version?: string;
  body?: string;
  downloaded?: number;
  total?: number;
  error?: string;
}

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });

  const checkForUpdates = async (interactive: boolean = true) => {
    try {
      setStatus({ state: "checking" });
      const update = await check();

      if (update?.available) {
        setStatus({
          state: "available",
          version: update.version,
          body: update.body,
        });
      } else {
        if (interactive) {
          setStatus({ state: "upToDate" });
          setTimeout(() => setStatus({ state: "idle" }), 4000);
        } else {
          setStatus({ state: "idle" });
        }
      }
    } catch (err) {
      console.warn("Update check failed:", err);
      if (interactive) {
        setStatus({
          state: "error",
          error: err instanceof Error ? err.message : String(err),
        });
        setTimeout(() => setStatus({ state: "idle" }), 5000);
      } else {
        setStatus({ state: "idle" });
      }
    }
  };

  const downloadAndInstallUpdate = async () => {
    try {
      setStatus((prev) => ({ ...prev, state: "downloading", downloaded: 0, total: 0 }));
      const update = await check();
      if (!update?.available) {
        setStatus({ state: "idle" });
        return;
      }

      let totalBytes = 0;
      let downloadedBytes = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalBytes = event.data.contentLength ?? 0;
            setStatus((prev) => ({ ...prev, total: totalBytes }));
            break;
          case "Progress":
            downloadedBytes += event.data.chunkLength;
            setStatus((prev) => ({ ...prev, downloaded: downloadedBytes, total: totalBytes }));
            break;
          case "Finished":
            break;
        }
      });

      await relaunch();
    } catch (err) {
      setStatus({
        state: "error",
        error: err instanceof Error ? err.message : String(err),
      });
      setTimeout(() => setStatus({ state: "idle" }), 5000);
    }
  };

  const dismiss = () => {
    setStatus({ state: "idle" });
  };

  return {
    status,
    checkForUpdates,
    downloadAndInstallUpdate,
    dismiss,
  };
}
