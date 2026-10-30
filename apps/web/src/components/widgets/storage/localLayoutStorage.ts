import { repairLayout } from "../engine/repair";
import type { LayoutStorage } from "./layoutStorage";

const STORAGE_KEY = "xiaotrack.dashboard.layout";

/**
 * LayoutStorage backed by the browser's localStorage (V1).
 * Async on purpose: same contract as the future API implementation.
 */
export const localLayoutStorage: LayoutStorage = {
    async load() {
        let raw: unknown;
        try {
            // Missing key (first launch) → "null" → null → repairLayout returns []
            raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        } catch {
            console.warn("[layout] unreadable JSON, starting empty");
            return [];
        }
        return repairLayout(raw);
    },

    async save(instances) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
    },
};
