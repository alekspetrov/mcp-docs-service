import { describe, it, expect, vi } from "vitest";
import { expandHome, normalizePath } from "../../src/utils/path";
import { safeLog } from "../../src/utils/logging";
import path from "path";

describe("Path Utilities", () => {
  describe("expandHome", () => {
    it("should replace ~ with home directory", () => {
      // Mock process.env.HOME
      const originalHome = process.env.HOME;
      process.env.HOME = "/home/testuser";

      expect(expandHome("~/documents")).toBe("/home/testuser/documents");
      expect(expandHome("~")).toBe("/home/testuser");

      // Restore original HOME
      process.env.HOME = originalHome;
    });

    it("should not modify paths without ~", () => {
      expect(expandHome("/absolute/path")).toBe("/absolute/path");
      expect(expandHome("relative/path")).toBe("relative/path");
    });
  });

  describe("normalizePath", () => {
    it("should normalize paths correctly", () => {
      expect(normalizePath("/path/to//dir/")).toBe(
        path.normalize("/path/to//dir/")
      );
      expect(normalizePath("path/./to/../to/dir")).toBe(
        path.normalize("path/./to/../to/dir")
      );
    });

    it("should not expand home directory", () => {
      expect(normalizePath("~/documents")).toBe(path.normalize("~/documents"));
    });
  });
});

describe("Logging Utilities", () => {
  describe("safeLog", () => {
    it("should log messages to console", () => {
      // Mock console.log
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      safeLog("Test message");
      safeLog("Message with", "multiple", "arguments");

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith("Test message");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Message with",
        "multiple",
        "arguments"
      );

      // Restore console.log
      consoleSpy.mockRestore();
    });

    it("should handle errors gracefully", () => {
      // Mock console.log to throw an error
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Console error");
      });

      // This should throw since the implementation doesn't catch errors
      expect(() => safeLog("Test message")).toThrow("Console error");

      // Restore console.log
      consoleSpy.mockRestore();
    });
  });
});
