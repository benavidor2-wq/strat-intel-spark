// CLAUDE_NOTE (Google Drive connection)
// Purpose: owner-facing control surface for the Drive ingestion source.
// Data contract: `drive_config` row via useDriveConfig(); actions go through
//   useConnectDrive / useSyncDriveNow / useDisconnectDrive / useSetDriveFolder
//   in @/lib/dataSource (the only Supabase boundary).
// Owner: ingestion (Drive source).
import { useEffect, useState } from "react";
import { Cloud, Loader2, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useConnectDrive,
  useDisconnectDrive,
  useDriveConfig,
  useSetDriveFolder,
  useSyncDriveNow,
  relativeTime,
  type DriveStatus,
} from "@/lib/dataSource";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<DriveStatus, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  error: "Error",
};

function StatusPill({ status, email }: { status: DriveStatus; email?: string | null }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status === "connected" && "border-primary/30 bg-primary/10 text-primary",
        status === "connecting" && "border-border bg-muted text-muted-foreground",
        status === "disconnected" && "border-border bg-muted text-muted-foreground",
        status === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "connected" ? "bg-primary" : status === "error" ? "bg-destructive" : "bg-muted-foreground",
        )}
      />
      {STATUS_LABEL[status]}
      {status === "connected" && email ? ` · ${email}` : ""}
    </span>
  );
}

export function GoogleDriveCard() {
  const { data: config, refetch } = useDriveConfig();
  const connect = useConnectDrive();
  const sync = useSyncDriveNow();
  const disconnect = useDisconnectDrive();
  const setFolder = useSetDriveFolder();
  const [folderInput, setFolderInput] = useState("");

  // Handle the OAuth round-trip result (?drive=connected | ?drive=error&reason=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const drive = params.get("drive");
    if (!drive) return;
    if (drive === "connected") toast.success("Google Drive connected");
    else if (drive === "error") toast.error(`Google Drive connection failed: ${params.get("reason") ?? "unknown error"}`);
    params.delete("drive");
    params.delete("reason");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
    refetch();
  }, [refetch]);

  const status: DriveStatus = config?.status ?? "disconnected";
  const isConnected = status === "connected";
  const currentFolder = config?.folder_name || config?.folder_id || null;

  const saveFolder = () => {
    if (!folderInput.trim()) return;
    setFolder.mutate(folderInput, {
      onSuccess: (id) => {
        toast.success(`Monitored folder set to ${id}`);
        setFolderInput("");
      },
      onError: (e: any) => toast.error(e?.message ?? "Could not save folder"),
    });
  };

  return (
    <div className="glass-widget rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold">Google Drive</div>
            <div className="text-xs text-muted-foreground">Import invoices from a watched folder.</div>
          </div>
        </div>
        <StatusPill status={status} email={config?.connected_email} />
      </div>

      {status === "error" && config?.last_error && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
          {config.last_error}
        </p>
      )}

      {isConnected && (
        <dl className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-border bg-card/60 p-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Monitored folder</dt>
            <dd className="mt-0.5 truncate font-semibold">{currentFolder ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last synced</dt>
            <dd className="mt-0.5 font-semibold">{relativeTime(config?.last_polled_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Files pulled</dt>
            <dd className="mt-0.5 font-mono-data font-semibold">{config?.files_seen ?? 0}</dd>
          </div>
        </dl>
      )}

      <div className="mt-4">
        <label htmlFor="drive-folder" className="text-xs font-semibold text-muted-foreground">
          Monitored folder
        </label>
        <div className="mt-1.5 flex gap-2">
          <Input
            id="drive-folder"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder={currentFolder ? `Current: ${currentFolder}` : "Paste a Drive folder link or ID"}
            className="h-9 text-xs"
          />
          <Button size="sm" variant="outline" onClick={saveFolder} disabled={setFolder.isPending || !folderInput.trim()}>
            {setFolder.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save"}
          </Button>
        </div>
        {!isConnected && currentFolder && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">Current folder: {currentFolder}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isConnected && (
          <Button
            size="sm"
            disabled={connect.isPending}
            onClick={() =>
              connect.mutate(window.location.origin + window.location.pathname, {
                onError: (e: any) => toast.error(e?.message ?? "Could not start Google sign-in"),
              })
            }
          >
            {connect.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Cloud size={14} className="mr-1" />}
            Connect Google Drive
          </Button>
        )}
        {isConnected && (
          <>
            <Button
              size="sm"
              disabled={sync.isPending}
              onClick={() =>
                sync.mutate(undefined, {
                  onSuccess: () => toast.success("Drive sync finished"),
                  onError: (e: any) => toast.error(e?.message ?? "Sync failed"),
                })
              }
            >
              {sync.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />}
              {sync.isPending ? "Syncing…" : "Sync now"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disconnect.isPending}
              onClick={() =>
                disconnect.mutate(undefined, {
                  onSuccess: () => toast.success("Google Drive disconnected"),
                  onError: (e: any) => toast.error(e?.message ?? "Could not disconnect"),
                })
              }
            >
              <Unplug size={14} className="mr-1" />
              Disconnect
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
