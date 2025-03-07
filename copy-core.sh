#!/bin/bash

# Create core directories if they don't exist
mkdir -p src/core

# Copy core components
cp ../src/mcp/docs-manager/lib/docManager.ts src/core/docManager.ts
cp ../src/mcp/docs-manager/lib/docProcessor.ts src/core/docProcessor.ts
cp ../src/mcp/docs-manager/lib/docAnalyzer.ts src/core/docAnalyzer.ts
cp ../src/mcp/docs-manager/lib/mcpDocsServer.ts src/core/mcpDocsServer.ts

# Update imports in core components
sed -i '' 's/from "\.\/docManager\.ts"/from "\.\/docManager\.ts"/g' src/core/docAnalyzer.ts
sed -i '' 's/from "\.\/docProcessor\.ts"/from "\.\/docProcessor\.ts"/g' src/core/docAnalyzer.ts
sed -i '' 's/from "\.\/types\.ts"/from "\.\.\/types\/index\.ts"/g' src/core/*.ts

echo "Core components copied and updated successfully!"