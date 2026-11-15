import assert from "node:assert/strict";
import { test } from "node:test";
import { canViewStory } from "../src/services/StoryService.js";

const ownerId = "owner-id";
const viewerId = "viewer-id";

test("story access keeps public stories visible", () => {
  assert.equal(
    canViewStory({ _id: ownerId, isPrivate: false }, viewerId, new Set()),
    true
  );
});

test("story access allows the owner to see private stories", () => {
  assert.equal(
    canViewStory({ _id: ownerId, isPrivate: true }, ownerId, new Set()),
    true
  );
});

test("story access hides private stories from non-followers", () => {
  assert.equal(
    canViewStory({ _id: ownerId, isPrivate: true }, viewerId, new Set()),
    false
  );
});

test("story access denies a story with no author", () => {
  assert.equal(canViewStory(null, viewerId, new Set()), false);
});

test("story access permits followers of a private profile", () => {
  assert.equal(
    canViewStory({ _id: ownerId, isPrivate: true }, viewerId, new Set([ownerId])),
    true
  );
});
