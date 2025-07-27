import { uploader } from ".";

export function createMulter(storage?: uploader.DiskStorageOptions) {
  const engine = storage
    ? uploader.diskStorage(storage)
    : uploader.memoryStorage();
  return uploader({ storage: engine });
}
