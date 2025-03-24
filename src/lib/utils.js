/**
 * Parse frontmatter from markdown content
 * @param {string} content - The markdown content with frontmatter
 * @returns {Object} - Parsed frontmatter and content
 */
export function parseFrontmatter(content) {
  // If no content, return empty
  if (!content || content.trim() === "") {
    return { frontmatter: {}, content: "" };
  }

  // Check if the content has frontmatter (starts with ---)
  if (!content.startsWith("---")) {
    return { frontmatter: {}, content };
  }

  try {
    // Find the end of the frontmatter
    const endIndex = content.indexOf("---", 3);
    if (endIndex === -1) {
      return { frontmatter: {}, content };
    }

    // Extract frontmatter and parse as YAML
    const frontmatterText = content.substring(3, endIndex).trim();
    const frontmatter = parseFrontmatterLines(frontmatterText);

    // Extract the content after frontmatter
    const markdownContent = content.substring(endIndex + 3).trim();

    return { frontmatter, content: markdownContent };
  } catch (error) {
    console.error("Error parsing frontmatter:", error);
    return { frontmatter: {}, content };
  }
}

/**
 * Parse frontmatter lines into an object
 * @param {string} frontmatterText - The frontmatter text to parse
 * @returns {Object} - Parsed frontmatter object
 */
function parseFrontmatterLines(frontmatterText) {
  const frontmatter = {};
  const lines = frontmatterText.split("\n");

  let currentKey = null;
  let isMultilineValue = false;
  let multilineValue = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === "") continue;

    if (isMultilineValue) {
      if (trimmedLine.startsWith("  -")) {
        // Continue array item
        const value = trimmedLine.substring(3).trim();
        if (!Array.isArray(frontmatter[currentKey])) {
          frontmatter[currentKey] = [];
        }
        frontmatter[currentKey].push(value);
      } else if (trimmedLine.startsWith("  ")) {
        // Continue multiline value
        multilineValue += "\n" + trimmedLine.substring(2);
      } else {
        // End of multiline value
        if (multilineValue) {
          frontmatter[currentKey] = multilineValue.trim();
          multilineValue = "";
        }
        isMultilineValue = false;
        currentKey = null;
      }
    }

    if (!isMultilineValue) {
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex > 0) {
        currentKey = trimmedLine.substring(0, colonIndex).trim();
        let value = trimmedLine.substring(colonIndex + 1).trim();

        if (value === "|" || value === ">") {
          // Multiline value starts
          isMultilineValue = true;
          multilineValue = "";
        } else if (value.startsWith("[") && value.endsWith("]")) {
          // Array value
          value = value
            .substring(1, value.length - 1)
            .split(",")
            .map((v) => v.trim());
          frontmatter[currentKey] = value;
        } else if (value === "") {
          // Empty value, might be the start of a sequence
          isMultilineValue = true;
          frontmatter[currentKey] = [];
        } else {
          // Regular single-line value
          if (value === "true") value = true;
          else if (value === "false") value = false;
          else if (!isNaN(Number(value))) value = Number(value);
          else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }

          frontmatter[currentKey] = value;
        }
      }
    }
  }

  // Handle any unclosed multiline value
  if (isMultilineValue && multilineValue) {
    frontmatter[currentKey] = multilineValue.trim();
  }

  return frontmatter;
}

/**
 * Format an object as YAML frontmatter
 * @param {Object} frontmatter - The frontmatter object
 * @returns {string} - The formatted frontmatter string
 */
export function formatFrontmatter(frontmatter) {
  let result = "---\n";

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      result += `${key}:\n`;
      for (const item of value) {
        result += `  - ${item}\n`;
      }
    } else if (typeof value === "object" && value !== null) {
      result += `${key}:\n`;
      for (const [subKey, subValue] of Object.entries(value)) {
        result += `  ${subKey}: ${JSON.stringify(subValue)}\n`;
      }
    } else if (
      typeof value === "string" &&
      (value.includes("\n") || value.includes('"') || value.includes("'"))
    ) {
      // Multiline or contains quotes - use block scalar
      result += `${key}: |\n`;
      for (const line of value.split("\n")) {
        result += `  ${line}\n`;
      }
    } else {
      result += `${key}: ${
        typeof value === "string" ? JSON.stringify(value) : value
      }\n`;
    }
  }

  result += "---\n\n";
  return result;
}
