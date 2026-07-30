package com.vpertz.media;

final class MediaTypes {
    private MediaTypes() {
    }

    static String fromExtension(String extension) {
        return switch (extension) {
            case "png" -> "image/png";
            case "jpg" -> "image/jpeg";
            case "webp" -> "image/webp";
            case "gif" -> "image/gif";
            default -> "application/octet-stream";
        };
    }

    static String fromObjectKey(String objectKey) {
        int dot = objectKey.lastIndexOf('.');
        return fromExtension(dot < 0 ? "" : objectKey.substring(dot + 1).toLowerCase());
    }
}
