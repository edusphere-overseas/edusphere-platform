"use client";

/**
 * Content area of the Edusphere admin portal (Sanity Studio), embedded at /admin/content.
 */
import { defineConfig, type DocumentActionComponent } from "sanity";
import { structureTool } from "sanity/structure";
import { useToast } from "@sanity/ui/toast";
import { PackagePlus } from "lucide-react";
import { apiVersion, dataset, projectId, studioBasePath } from "./src/sanity/env";
import { schemaTypes, singletonTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";
import { StarterContent } from "./src/sanity/tools/StarterContent";
import { LogoMark } from "./src/components/brand/LogoMark";

const singletonActions = new Set(["publish", "discardChanges", "restore"]);

/**
 * After Publish, ask the website to show the change straight away (it otherwise refreshes
 * on its own within a minute or two). The publish takes a moment to land, so try a few times.
 */
async function refreshWebsite() {
  for (const wait of [1500, 2500, 4000, 8000]) {
    await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      const res = await fetch("/api/revalidate", { method: "POST" });
      if (res.ok && (await res.json())?.revalidated) return true;
    } catch {
      // try again
    }
  }
  return false;
}

/** The normal Publish button, plus a website refresh and a note saying when it's live. */
function withWebsiteRefresh(Publish: DocumentActionComponent): DocumentActionComponent {
  const PublishAndRefresh: DocumentActionComponent = (props) => {
    const toast = useToast();
    const action = Publish(props);
    if (!action) return action;
    return {
      ...action,
      onHandle: () => {
        action.onHandle?.();
        void refreshWebsite().then((ok) =>
          toast.push({
            status: ok ? "success" : "info",
            title: ok ? "Live on the website" : "Published",
            description: ok ? "Reload the website page to see your change." : "The website will show it within a few minutes.",
          }),
        );
      },
    };
  };
  PublishAndRefresh.action = Publish.action;
  return PublishAndRefresh;
}

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
      (singletonTypes.has(context.schemaType) ? input.filter(({ action }) => action && singletonActions.has(action)) : input).map(
        (action) => (action.action === "publish" ? withWebsiteRefresh(action) : action),
      ),
  },
  plugins: [structureTool({ structure, title: "Content" })],
  tools: (prev) => [
    ...prev,
    { name: "starter-content", title: "Starter content", icon: PackagePlus, component: StarterContent },
  ],
});
