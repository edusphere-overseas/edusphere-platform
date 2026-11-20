"use client";

/**
 * Content area of the Edusphere admin portal (Sanity Studio), embedded at /admin/content.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { PackagePlus } from "lucide-react";
import { apiVersion, dataset, projectId, studioBasePath } from "./src/sanity/env";
import { schemaTypes, singletonTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { StarterContent } from "./src/sanity/tools/StarterContent";
import { LogoMark } from "./src/components/brand/LogoMark";

const singletonActions = new Set(["publish", "discardChanges", "restore"]);

function StudioIcon() {
  return <LogoMark className="h-full w-full" />;
}

export default defineConfig({
  name: "edusphere",
  title: "Edusphere Overseas",
  icon: StudioIcon,
  projectId,
  dataset,
  basePath: studioBasePath,
  apiVersion,
  schema: {
    types: schemaTypes,
    // No "create new" for one-of-a-kind documents such as Website settings
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,
  },
  plugins: [structureTool({ structure, title: "Content" })],
  tools: (prev) => [
    ...prev,
    { name: "starter-content", title: "Starter content", icon: PackagePlus, component: StarterContent },
  ],
});
