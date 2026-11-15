/**
 * NeetCode 150 Master Dataset
 *
 * All 150 problems from https://neetcode.io/practice/practice/neetcode150
 * organized into an 8-week study plan (weeks 1-7 introduce new problems,
 * week 8 is revision/mocks with no new assignments).
 *
 * NOTE: Some problems are primarily on LintCode, not LeetCode.
 * These are marked with comments. The URL still uses the closest
 * LeetCode slug for consistency:
 *   - Encode and Decode Strings
 *   - Walls and Gates
 *   - Number of Connected Components in an Undirected Graph
 *   - Graph Valid Tree
 *   - Meeting Rooms
 *   - Meeting Rooms II
 *   - Alien Dictionary
 */

export interface NeetCodeProblemSeed {
  id: string;
  title: string;
  slug: string;
  url: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estMinutes: number;
  weekNumber: number;
  dayNumber: number;
}

export const NEETCODE_150: NeetCodeProblemSeed[] = [
  // ═══════════════════════════════════════════════════════════════
  // WEEK 1: Arrays & Hashing (9) + Two Pointers (5) + Sliding Window (6) = 20
  // ═══════════════════════════════════════════════════════════════

  // --- Arrays & Hashing (9) ---
  { id: 'nc-contains-duplicate',          title: 'Contains Duplicate',              slug: 'contains-duplicate',               url: 'https://leetcode.com/problems/contains-duplicate/',               category: 'Arrays & Hashing', difficulty: 'Easy',   estMinutes: 15, weekNumber: 1, dayNumber: 1 },
  { id: 'nc-valid-anagram',               title: 'Valid Anagram',                   slug: 'valid-anagram',                    url: 'https://leetcode.com/problems/valid-anagram/',                    category: 'Arrays & Hashing', difficulty: 'Easy',   estMinutes: 15, weekNumber: 1, dayNumber: 1 },
  { id: 'nc-two-sum',                     title: 'Two Sum',                         slug: 'two-sum',                          url: 'https://leetcode.com/problems/two-sum/',                          category: 'Arrays & Hashing', difficulty: 'Easy',   estMinutes: 15, weekNumber: 1, dayNumber: 2 },
  { id: 'nc-group-anagrams',              title: 'Group Anagrams',                  slug: 'group-anagrams',                   url: 'https://leetcode.com/problems/group-anagrams/',                   category: 'Arrays & Hashing', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 2 },
  { id: 'nc-top-k-frequent-elements',     title: 'Top K Frequent Elements',         slug: 'top-k-frequent-elements',          url: 'https://leetcode.com/problems/top-k-frequent-elements/',          category: 'Arrays & Hashing', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 3 },
  { id: 'nc-encode-and-decode-strings',   title: 'Encode and Decode Strings',       slug: 'encode-and-decode-strings',        url: 'https://leetcode.com/problems/encode-and-decode-strings/',        category: 'Arrays & Hashing', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 3 }, // LintCode problem
  { id: 'nc-product-of-array-except-self', title: 'Product of Array Except Self',   slug: 'product-of-array-except-self',     url: 'https://leetcode.com/problems/product-of-array-except-self/',     category: 'Arrays & Hashing', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 4 },
  { id: 'nc-longest-consecutive-sequence', title: 'Longest Consecutive Sequence',   slug: 'longest-consecutive-sequence',     url: 'https://leetcode.com/problems/longest-consecutive-sequence/',     category: 'Arrays & Hashing', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 4 },
  { id: 'nc-valid-sudoku',                title: 'Valid Sudoku',                    slug: 'valid-sudoku',                     url: 'https://leetcode.com/problems/valid-sudoku/',                     category: 'Arrays & Hashing', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 5 },

  // --- Two Pointers (5) ---
  { id: 'nc-valid-palindrome',             title: 'Valid Palindrome',                slug: 'valid-palindrome',                 url: 'https://leetcode.com/problems/valid-palindrome/',                 category: 'Two Pointers', difficulty: 'Easy',   estMinutes: 15, weekNumber: 1, dayNumber: 5 },
  { id: 'nc-two-sum-ii',                   title: 'Two Sum II Input Array Is Sorted', slug: 'two-sum-ii-input-array-is-sorted', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', category: 'Two Pointers', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 5 },
  { id: 'nc-3sum',                         title: '3Sum',                            slug: '3sum',                             url: 'https://leetcode.com/problems/3sum/',                             category: 'Two Pointers', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 6 },
  { id: 'nc-container-with-most-water',    title: 'Container With Most Water',       slug: 'container-with-most-water',        url: 'https://leetcode.com/problems/container-with-most-water/',        category: 'Two Pointers', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 6 },
  { id: 'nc-trapping-rain-water',          title: 'Trapping Rain Water',             slug: 'trapping-rain-water',              url: 'https://leetcode.com/problems/trapping-rain-water/',              category: 'Two Pointers', difficulty: 'Hard',   estMinutes: 40, weekNumber: 1, dayNumber: 7 },

  // --- Sliding Window (6) ---
  { id: 'nc-best-time-to-buy-and-sell-stock',          title: 'Best Time to Buy and Sell Stock',              slug: 'best-time-to-buy-and-sell-stock',              url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',              category: 'Sliding Window', difficulty: 'Easy',   estMinutes: 15, weekNumber: 1, dayNumber: 6 },
  { id: 'nc-longest-substring-without-repeating-characters', title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', category: 'Sliding Window', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 6 },
  { id: 'nc-longest-repeating-character-replacement',  title: 'Longest Repeating Character Replacement',      slug: 'longest-repeating-character-replacement',      url: 'https://leetcode.com/problems/longest-repeating-character-replacement/',      category: 'Sliding Window', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 7 },
  { id: 'nc-permutation-in-string',                    title: 'Permutation in String',                        slug: 'permutation-in-string',                        url: 'https://leetcode.com/problems/permutation-in-string/',                        category: 'Sliding Window', difficulty: 'Medium', estMinutes: 25, weekNumber: 1, dayNumber: 7 },
  { id: 'nc-minimum-window-substring',                 title: 'Minimum Window Substring',                     slug: 'minimum-window-substring',                     url: 'https://leetcode.com/problems/minimum-window-substring/',                     category: 'Sliding Window', difficulty: 'Hard',   estMinutes: 40, weekNumber: 1, dayNumber: 7 },
  { id: 'nc-sliding-window-maximum',                   title: 'Sliding Window Maximum',                       slug: 'sliding-window-maximum',                       url: 'https://leetcode.com/problems/sliding-window-maximum/',                       category: 'Sliding Window', difficulty: 'Hard',   estMinutes: 40, weekNumber: 1, dayNumber: 7 },

  // ═══════════════════════════════════════════════════════════════
  // WEEK 2: Stack (7) + Binary Search (7) + Linked List (11) = 25
  // ═══════════════════════════════════════════════════════════════

  // --- Stack (7) ---
  { id: 'nc-valid-parentheses',            title: 'Valid Parentheses',               slug: 'valid-parentheses',                url: 'https://leetcode.com/problems/valid-parentheses/',                category: 'Stack', difficulty: 'Easy',   estMinutes: 15, weekNumber: 2, dayNumber: 1 },
  { id: 'nc-min-stack',                    title: 'Min Stack',                       slug: 'min-stack',                        url: 'https://leetcode.com/problems/min-stack/',                        category: 'Stack', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 1 },
  { id: 'nc-evaluate-reverse-polish-notation', title: 'Evaluate Reverse Polish Notation', slug: 'evaluate-reverse-polish-notation', url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', category: 'Stack', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 1 },
  { id: 'nc-generate-parentheses',         title: 'Generate Parentheses',            slug: 'generate-parentheses',             url: 'https://leetcode.com/problems/generate-parentheses/',             category: 'Stack', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 2 },
  { id: 'nc-daily-temperatures',           title: 'Daily Temperatures',              slug: 'daily-temperatures',               url: 'https://leetcode.com/problems/daily-temperatures/',               category: 'Stack', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 2 },
  { id: 'nc-car-fleet',                    title: 'Car Fleet',                       slug: 'car-fleet',                        url: 'https://leetcode.com/problems/car-fleet/',                        category: 'Stack', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 3 },
  { id: 'nc-largest-rectangle-in-histogram', title: 'Largest Rectangle in Histogram', slug: 'largest-rectangle-in-histogram',   url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/',   category: 'Stack', difficulty: 'Hard',   estMinutes: 40, weekNumber: 2, dayNumber: 7 },

  // --- Binary Search (7) ---
  { id: 'nc-binary-search',               title: 'Binary Search',                   slug: 'binary-search',                    url: 'https://leetcode.com/problems/binary-search/',                    category: 'Binary Search', difficulty: 'Easy',   estMinutes: 15, weekNumber: 2, dayNumber: 3 },
  { id: 'nc-search-a-2d-matrix',           title: 'Search a 2D Matrix',              slug: 'search-a-2d-matrix',               url: 'https://leetcode.com/problems/search-a-2d-matrix/',               category: 'Binary Search', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 3 },
  { id: 'nc-koko-eating-bananas',          title: 'Koko Eating Bananas',             slug: 'koko-eating-bananas',              url: 'https://leetcode.com/problems/koko-eating-bananas/',              category: 'Binary Search', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 4 },
  { id: 'nc-find-minimum-in-rotated-sorted-array', title: 'Find Minimum in Rotated Sorted Array', slug: 'find-minimum-in-rotated-sorted-array', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', category: 'Binary Search', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 4 },
  { id: 'nc-search-in-rotated-sorted-array', title: 'Search in Rotated Sorted Array', slug: 'search-in-rotated-sorted-array',   url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',   category: 'Binary Search', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 5 },
  { id: 'nc-time-based-key-value-store',   title: 'Time Based Key Value Store',      slug: 'time-based-key-value-store',       url: 'https://leetcode.com/problems/time-based-key-value-store/',       category: 'Binary Search', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 5 },
  { id: 'nc-median-of-two-sorted-arrays',  title: 'Median of Two Sorted Arrays',     slug: 'median-of-two-sorted-arrays',      url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',      category: 'Binary Search', difficulty: 'Hard',   estMinutes: 40, weekNumber: 2, dayNumber: 7 },

  // --- Linked List (11) ---
  { id: 'nc-reverse-linked-list',          title: 'Reverse Linked List',             slug: 'reverse-linked-list',              url: 'https://leetcode.com/problems/reverse-linked-list/',              category: 'Linked List', difficulty: 'Easy',   estMinutes: 15, weekNumber: 2, dayNumber: 4 },
  { id: 'nc-merge-two-sorted-lists',       title: 'Merge Two Sorted Lists',          slug: 'merge-two-sorted-lists',           url: 'https://leetcode.com/problems/merge-two-sorted-lists/',           category: 'Linked List', difficulty: 'Easy',   estMinutes: 15, weekNumber: 2, dayNumber: 5 },
  { id: 'nc-reorder-list',                 title: 'Reorder List',                    slug: 'reorder-list',                     url: 'https://leetcode.com/problems/reorder-list/',                     category: 'Linked List', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 6 },
  { id: 'nc-remove-nth-node-from-end-of-list', title: 'Remove Nth Node From End of List', slug: 'remove-nth-node-from-end-of-list', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', category: 'Linked List', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 6 },
  { id: 'nc-copy-list-with-random-pointer', title: 'Copy List With Random Pointer',  slug: 'copy-list-with-random-pointer',    url: 'https://leetcode.com/problems/copy-list-with-random-pointer/',    category: 'Linked List', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 6 },
  { id: 'nc-add-two-numbers',              title: 'Add Two Numbers',                 slug: 'add-two-numbers',                  url: 'https://leetcode.com/problems/add-two-numbers/',                  category: 'Linked List', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 6 },
  { id: 'nc-linked-list-cycle',            title: 'Linked List Cycle',               slug: 'linked-list-cycle',                url: 'https://leetcode.com/problems/linked-list-cycle/',                category: 'Linked List', difficulty: 'Easy',   estMinutes: 15, weekNumber: 2, dayNumber: 2 },
  { id: 'nc-find-the-duplicate-number',    title: 'Find The Duplicate Number',       slug: 'find-the-duplicate-number',        url: 'https://leetcode.com/problems/find-the-duplicate-number/',        category: 'Linked List', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 7 },
  { id: 'nc-lru-cache',                    title: 'LRU Cache',                       slug: 'lru-cache',                        url: 'https://leetcode.com/problems/lru-cache/',                        category: 'Linked List', difficulty: 'Medium', estMinutes: 25, weekNumber: 2, dayNumber: 7 },
  { id: 'nc-merge-k-sorted-lists',         title: 'Merge K Sorted Lists',            slug: 'merge-k-sorted-lists',             url: 'https://leetcode.com/problems/merge-k-sorted-lists/',             category: 'Linked List', difficulty: 'Hard',   estMinutes: 40, weekNumber: 2, dayNumber: 7 },
  { id: 'nc-reverse-nodes-in-k-group',     title: 'Reverse Nodes in K Group',        slug: 'reverse-nodes-in-k-group',         url: 'https://leetcode.com/problems/reverse-nodes-in-k-group/',         category: 'Linked List', difficulty: 'Hard',   estMinutes: 40, weekNumber: 2, dayNumber: 7 },

  // ═══════════════════════════════════════════════════════════════
  // WEEK 3: Trees (15) + Heap / Priority Queue (7) = 22
  // ═══════════════════════════════════════════════════════════════

  // --- Trees (15) ---
  { id: 'nc-invert-binary-tree',           title: 'Invert Binary Tree',              slug: 'invert-binary-tree',               url: 'https://leetcode.com/problems/invert-binary-tree/',               category: 'Trees', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 1 },
  { id: 'nc-maximum-depth-of-binary-tree', title: 'Maximum Depth of Binary Tree',    slug: 'maximum-depth-of-binary-tree',     url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',     category: 'Trees', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 1 },
  { id: 'nc-diameter-of-binary-tree',      title: 'Diameter of Binary Tree',         slug: 'diameter-of-binary-tree',          url: 'https://leetcode.com/problems/diameter-of-binary-tree/',          category: 'Trees', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 1 },
  { id: 'nc-balanced-binary-tree',         title: 'Balanced Binary Tree',            slug: 'balanced-binary-tree',             url: 'https://leetcode.com/problems/balanced-binary-tree/',             category: 'Trees', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 2 },
  { id: 'nc-same-tree',                    title: 'Same Tree',                       slug: 'same-tree',                        url: 'https://leetcode.com/problems/same-tree/',                        category: 'Trees', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 2 },
  { id: 'nc-subtree-of-another-tree',      title: 'Subtree of Another Tree',         slug: 'subtree-of-another-tree',          url: 'https://leetcode.com/problems/subtree-of-another-tree/',          category: 'Trees', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 2 },
  { id: 'nc-lowest-common-ancestor-of-a-bst', title: 'Lowest Common Ancestor of a Binary Search Tree', slug: 'lowest-common-ancestor-of-a-binary-search-tree', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 3 },
  { id: 'nc-binary-tree-level-order-traversal', title: 'Binary Tree Level Order Traversal', slug: 'binary-tree-level-order-traversal', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 3 },
  { id: 'nc-binary-tree-right-side-view',  title: 'Binary Tree Right Side View',     slug: 'binary-tree-right-side-view',      url: 'https://leetcode.com/problems/binary-tree-right-side-view/',      category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 4 },
  { id: 'nc-count-good-nodes-in-binary-tree', title: 'Count Good Nodes in Binary Tree', slug: 'count-good-nodes-in-binary-tree', url: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/', category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 4 },
  { id: 'nc-validate-binary-search-tree',  title: 'Validate Binary Search Tree',     slug: 'validate-binary-search-tree',      url: 'https://leetcode.com/problems/validate-binary-search-tree/',      category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 5 },
  { id: 'nc-kth-smallest-element-in-a-bst', title: 'Kth Smallest Element in a BST', slug: 'kth-smallest-element-in-a-bst',    url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/',    category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 5 },
  { id: 'nc-construct-binary-tree-from-preorder-and-inorder-traversal', title: 'Construct Binary Tree From Preorder and Inorder Traversal', slug: 'construct-binary-tree-from-preorder-and-inorder-traversal', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', category: 'Trees', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 5 },
  { id: 'nc-binary-tree-maximum-path-sum', title: 'Binary Tree Maximum Path Sum',    slug: 'binary-tree-maximum-path-sum',     url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',     category: 'Trees', difficulty: 'Hard',   estMinutes: 40, weekNumber: 3, dayNumber: 7 },
  { id: 'nc-serialize-and-deserialize-binary-tree', title: 'Serialize and Deserialize Binary Tree', slug: 'serialize-and-deserialize-binary-tree', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', category: 'Trees', difficulty: 'Hard', estMinutes: 40, weekNumber: 3, dayNumber: 7 },

  // --- Heap / Priority Queue (7) ---
  { id: 'nc-kth-largest-element-in-a-stream', title: 'Kth Largest Element in a Stream', slug: 'kth-largest-element-in-a-stream', url: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', category: 'Heap / Priority Queue', difficulty: 'Easy', estMinutes: 15, weekNumber: 3, dayNumber: 3 },
  { id: 'nc-last-stone-weight',            title: 'Last Stone Weight',               slug: 'last-stone-weight',                url: 'https://leetcode.com/problems/last-stone-weight/',                category: 'Heap / Priority Queue', difficulty: 'Easy',   estMinutes: 15, weekNumber: 3, dayNumber: 4 },
  { id: 'nc-k-closest-points-to-origin',   title: 'K Closest Points to Origin',      slug: 'k-closest-points-to-origin',       url: 'https://leetcode.com/problems/k-closest-points-to-origin/',       category: 'Heap / Priority Queue', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 6 },
  { id: 'nc-kth-largest-element-in-an-array', title: 'Kth Largest Element in an Array', slug: 'kth-largest-element-in-an-array', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', category: 'Heap / Priority Queue', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 6 },
  { id: 'nc-task-scheduler',               title: 'Task Scheduler',                  slug: 'task-scheduler',                   url: 'https://leetcode.com/problems/task-scheduler/',                   category: 'Heap / Priority Queue', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 6 },
  { id: 'nc-design-twitter',               title: 'Design Twitter',                  slug: 'design-twitter',                   url: 'https://leetcode.com/problems/design-twitter/',                   category: 'Heap / Priority Queue', difficulty: 'Medium', estMinutes: 25, weekNumber: 3, dayNumber: 6 },
  { id: 'nc-find-median-from-data-stream', title: 'Find Median From Data Stream',    slug: 'find-median-from-data-stream',     url: 'https://leetcode.com/problems/find-median-from-data-stream/',     category: 'Heap / Priority Queue', difficulty: 'Hard',   estMinutes: 40, weekNumber: 3, dayNumber: 7 },

  // ═══════════════════════════════════════════════════════════════
  // WEEK 4: Graphs (13) + Advanced Graphs (6) = 19
  // ═══════════════════════════════════════════════════════════════

  // --- Graphs (13) ---
  { id: 'nc-number-of-islands',            title: 'Number of Islands',               slug: 'number-of-islands',                url: 'https://leetcode.com/problems/number-of-islands/',                category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 1 },
  { id: 'nc-max-area-of-island',           title: 'Max Area of Island',              slug: 'max-area-of-island',               url: 'https://leetcode.com/problems/max-area-of-island/',               category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 1 },
  { id: 'nc-clone-graph',                  title: 'Clone Graph',                     slug: 'clone-graph',                      url: 'https://leetcode.com/problems/clone-graph/',                      category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 2 },
  { id: 'nc-walls-and-gates',              title: 'Walls and Gates',                 slug: 'walls-and-gates',                  url: 'https://leetcode.com/problems/walls-and-gates/',                  category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 2 }, // LintCode problem
  { id: 'nc-pacific-atlantic-water-flow',  title: 'Pacific Atlantic Water Flow',     slug: 'pacific-atlantic-water-flow',      url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/',      category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 2 },
  { id: 'nc-surrounded-regions',           title: 'Surrounded Regions',              slug: 'surrounded-regions',               url: 'https://leetcode.com/problems/surrounded-regions/',               category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 3 },
  { id: 'nc-rotting-oranges',              title: 'Rotting Oranges',                 slug: 'rotting-oranges',                  url: 'https://leetcode.com/problems/rotting-oranges/',                  category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 3 },
  { id: 'nc-course-schedule',              title: 'Course Schedule',                 slug: 'course-schedule',                  url: 'https://leetcode.com/problems/course-schedule/',                  category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 4 },
  { id: 'nc-course-schedule-ii',           title: 'Course Schedule II',              slug: 'course-schedule-ii',               url: 'https://leetcode.com/problems/course-schedule-ii/',               category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 4 },
  { id: 'nc-redundant-connection',         title: 'Redundant Connection',            slug: 'redundant-connection',             url: 'https://leetcode.com/problems/redundant-connection/',             category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 5 },
  { id: 'nc-number-of-connected-components', title: 'Number of Connected Components in an Undirected Graph', slug: 'number-of-connected-components-in-an-undirected-graph', url: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 5 }, // LintCode problem
  { id: 'nc-graph-valid-tree',             title: 'Graph Valid Tree',                slug: 'graph-valid-tree',                 url: 'https://leetcode.com/problems/graph-valid-tree/',                 category: 'Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 5 }, // LintCode problem
  { id: 'nc-word-ladder',                  title: 'Word Ladder',                     slug: 'word-ladder',                      url: 'https://leetcode.com/problems/word-ladder/',                      category: 'Graphs', difficulty: 'Hard',   estMinutes: 40, weekNumber: 4, dayNumber: 7 },

  // --- Advanced Graphs (6) ---
  { id: 'nc-reconstruct-itinerary',        title: 'Reconstruct Itinerary',           slug: 'reconstruct-itinerary',            url: 'https://leetcode.com/problems/reconstruct-itinerary/',            category: 'Advanced Graphs', difficulty: 'Hard',   estMinutes: 40, weekNumber: 4, dayNumber: 7 },
  { id: 'nc-min-cost-to-connect-all-points', title: 'Min Cost to Connect All Points', slug: 'min-cost-to-connect-all-points', url: 'https://leetcode.com/problems/min-cost-to-connect-all-points/', category: 'Advanced Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 6 },
  { id: 'nc-network-delay-time',           title: 'Network Delay Time',              slug: 'network-delay-time',               url: 'https://leetcode.com/problems/network-delay-time/',               category: 'Advanced Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 6 },
  { id: 'nc-swim-in-rising-water',         title: 'Swim in Rising Water',            slug: 'swim-in-rising-water',             url: 'https://leetcode.com/problems/swim-in-rising-water/',             category: 'Advanced Graphs', difficulty: 'Hard',   estMinutes: 40, weekNumber: 4, dayNumber: 7 },
  { id: 'nc-alien-dictionary',             title: 'Alien Dictionary',                slug: 'alien-dictionary',                 url: 'https://leetcode.com/problems/alien-dictionary/',                 category: 'Advanced Graphs', difficulty: 'Hard',   estMinutes: 40, weekNumber: 4, dayNumber: 6 }, // LintCode problem
  { id: 'nc-cheapest-flights-within-k-stops', title: 'Cheapest Flights Within K Stops', slug: 'cheapest-flights-within-k-stops', url: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', category: 'Advanced Graphs', difficulty: 'Medium', estMinutes: 25, weekNumber: 4, dayNumber: 1 },

  // ═══════════════════════════════════════════════════════════════
  // WEEK 5: 1-D DP (12) + 2-D DP (11) = 23
  // ═══════════════════════════════════════════════════════════════

  // --- 1-D Dynamic Programming (12) ---
  { id: 'nc-climbing-stairs',              title: 'Climbing Stairs',                 slug: 'climbing-stairs',                  url: 'https://leetcode.com/problems/climbing-stairs/',                  category: '1-D Dynamic Programming', difficulty: 'Easy',   estMinutes: 15, weekNumber: 5, dayNumber: 1 },
  { id: 'nc-min-cost-climbing-stairs',     title: 'Min Cost Climbing Stairs',        slug: 'min-cost-climbing-stairs',         url: 'https://leetcode.com/problems/min-cost-climbing-stairs/',         category: '1-D Dynamic Programming', difficulty: 'Easy',   estMinutes: 15, weekNumber: 5, dayNumber: 1 },
  { id: 'nc-house-robber',                 title: 'House Robber',                    slug: 'house-robber',                     url: 'https://leetcode.com/problems/house-robber/',                     category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 1 },
  { id: 'nc-house-robber-ii',              title: 'House Robber II',                 slug: 'house-robber-ii',                  url: 'https://leetcode.com/problems/house-robber-ii/',                  category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 2 },
  { id: 'nc-longest-palindromic-substring', title: 'Longest Palindromic Substring',  slug: 'longest-palindromic-substring',    url: 'https://leetcode.com/problems/longest-palindromic-substring/',    category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 2 },
  { id: 'nc-palindromic-substrings',       title: 'Palindromic Substrings',          slug: 'palindromic-substrings',           url: 'https://leetcode.com/problems/palindromic-substrings/',           category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 3 },
  { id: 'nc-decode-ways',                  title: 'Decode Ways',                     slug: 'decode-ways',                      url: 'https://leetcode.com/problems/decode-ways/',                      category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 3 },
  { id: 'nc-coin-change',                  title: 'Coin Change',                     slug: 'coin-change',                      url: 'https://leetcode.com/problems/coin-change/',                      category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 4 },
  { id: 'nc-maximum-product-subarray',     title: 'Maximum Product Subarray',        slug: 'maximum-product-subarray',         url: 'https://leetcode.com/problems/maximum-product-subarray/',         category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 4 },
  { id: 'nc-word-break',                   title: 'Word Break',                      slug: 'word-break',                       url: 'https://leetcode.com/problems/word-break/',                       category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 5 },
  { id: 'nc-longest-increasing-subsequence', title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence',  url: 'https://leetcode.com/problems/longest-increasing-subsequence/',  category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 5 },
  { id: 'nc-partition-equal-subset-sum',   title: 'Partition Equal Subset Sum',      slug: 'partition-equal-subset-sum',       url: 'https://leetcode.com/problems/partition-equal-subset-sum/',       category: '1-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 5 },

  // --- 2-D Dynamic Programming (11) ---
  { id: 'nc-unique-paths',                 title: 'Unique Paths',                    slug: 'unique-paths',                     url: 'https://leetcode.com/problems/unique-paths/',                     category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 2 },
  { id: 'nc-longest-common-subsequence',   title: 'Longest Common Subsequence',      slug: 'longest-common-subsequence',       url: 'https://leetcode.com/problems/longest-common-subsequence/',       category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 3 },
  { id: 'nc-best-time-to-buy-and-sell-stock-with-cooldown', title: 'Best Time to Buy and Sell Stock With Cooldown', slug: 'best-time-to-buy-and-sell-stock-with-cooldown', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 4 },
  { id: 'nc-coin-change-ii',               title: 'Coin Change II',                  slug: 'coin-change-ii',                   url: 'https://leetcode.com/problems/coin-change-ii/',                   category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 5 },
  { id: 'nc-target-sum',                   title: 'Target Sum',                      slug: 'target-sum',                       url: 'https://leetcode.com/problems/target-sum/',                       category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 5 },
  { id: 'nc-interleaving-string',          title: 'Interleaving String',             slug: 'interleaving-string',              url: 'https://leetcode.com/problems/interleaving-string/',              category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 6 },
  { id: 'nc-longest-increasing-path-in-a-matrix', title: 'Longest Increasing Path in a Matrix', slug: 'longest-increasing-path-in-a-matrix', url: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/', category: '2-D Dynamic Programming', difficulty: 'Hard', estMinutes: 40, weekNumber: 5, dayNumber: 6 },
  { id: 'nc-distinct-subsequences',        title: 'Distinct Subsequences',           slug: 'distinct-subsequences',            url: 'https://leetcode.com/problems/distinct-subsequences/',            category: '2-D Dynamic Programming', difficulty: 'Hard',   estMinutes: 40, weekNumber: 5, dayNumber: 6 },
  { id: 'nc-edit-distance',                title: 'Edit Distance',                   slug: 'edit-distance',                    url: 'https://leetcode.com/problems/edit-distance/',                    category: '2-D Dynamic Programming', difficulty: 'Medium', estMinutes: 25, weekNumber: 5, dayNumber: 7 },
  { id: 'nc-burst-balloons',               title: 'Burst Balloons',                  slug: 'burst-balloons',                   url: 'https://leetcode.com/problems/burst-balloons/',                   category: '2-D Dynamic Programming', difficulty: 'Hard',   estMinutes: 40, weekNumber: 5, dayNumber: 7 },
  { id: 'nc-regular-expression-matching',  title: 'Regular Expression Matching',     slug: 'regular-expression-matching',      url: 'https://leetcode.com/problems/regular-expression-matching/',      category: '2-D Dynamic Programming', difficulty: 'Hard',   estMinutes: 40, weekNumber: 5, dayNumber: 7 },

  // ═══════════════════════════════════════════════════════════════
  // WEEK 6: Backtracking (9) + Intervals (6) + Greedy (8) = 23
  // ═══════════════════════════════════════════════════════════════

  // --- Backtracking (9) ---
  { id: 'nc-subsets',                      title: 'Subsets',                         slug: 'subsets',                          url: 'https://leetcode.com/problems/subsets/',                          category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 1 },
  { id: 'nc-combination-sum',              title: 'Combination Sum',                 slug: 'combination-sum',                  url: 'https://leetcode.com/problems/combination-sum/',                  category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 1 },
  { id: 'nc-permutations',                 title: 'Permutations',                    slug: 'permutations',                     url: 'https://leetcode.com/problems/permutations/',                     category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 1 },
  { id: 'nc-subsets-ii',                   title: 'Subsets II',                      slug: 'subsets-ii',                       url: 'https://leetcode.com/problems/subsets-ii/',                       category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 2 },
  { id: 'nc-combination-sum-ii',           title: 'Combination Sum II',              slug: 'combination-sum-ii',               url: 'https://leetcode.com/problems/combination-sum-ii/',               category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 2 },
  { id: 'nc-word-search',                  title: 'Word Search',                     slug: 'word-search',                      url: 'https://leetcode.com/problems/word-search/',                      category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 3 },
  { id: 'nc-palindrome-partitioning',      title: 'Palindrome Partitioning',         slug: 'palindrome-partitioning',          url: 'https://leetcode.com/problems/palindrome-partitioning/',          category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 3 },
  { id: 'nc-letter-combinations-of-a-phone-number', title: 'Letter Combinations of a Phone Number', slug: 'letter-combinations-of-a-phone-number', url: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', category: 'Backtracking', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 4 },
  { id: 'nc-n-queens',                     title: 'N Queens',                        slug: 'n-queens',                         url: 'https://leetcode.com/problems/n-queens/',                         category: 'Backtracking', difficulty: 'Hard',   estMinutes: 40, weekNumber: 6, dayNumber: 7 },

  // --- Intervals (6) ---
  { id: 'nc-insert-interval',              title: 'Insert Interval',                 slug: 'insert-interval',                  url: 'https://leetcode.com/problems/insert-interval/',                  category: 'Intervals', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 4 },
  { id: 'nc-merge-intervals',              title: 'Merge Intervals',                 slug: 'merge-intervals',                  url: 'https://leetcode.com/problems/merge-intervals/',                  category: 'Intervals', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 4 },
  { id: 'nc-non-overlapping-intervals',    title: 'Non Overlapping Intervals',       slug: 'non-overlapping-intervals',        url: 'https://leetcode.com/problems/non-overlapping-intervals/',        category: 'Intervals', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 5 },
  { id: 'nc-meeting-rooms',                title: 'Meeting Rooms',                   slug: 'meeting-rooms',                    url: 'https://leetcode.com/problems/meeting-rooms/',                    category: 'Intervals', difficulty: 'Easy',   estMinutes: 15, weekNumber: 6, dayNumber: 2 }, // LintCode problem
  { id: 'nc-meeting-rooms-ii',             title: 'Meeting Rooms II',                slug: 'meeting-rooms-ii',                 url: 'https://leetcode.com/problems/meeting-rooms-ii/',                 category: 'Intervals', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 5 }, // LintCode problem
  { id: 'nc-minimum-interval-to-include-each-query', title: 'Minimum Interval to Include Each Query', slug: 'minimum-interval-to-include-each-query', url: 'https://leetcode.com/problems/minimum-interval-to-include-each-query/', category: 'Intervals', difficulty: 'Hard', estMinutes: 40, weekNumber: 6, dayNumber: 7 },

  // --- Greedy (8) ---
  { id: 'nc-maximum-subarray',             title: 'Maximum Subarray',                slug: 'maximum-subarray',                 url: 'https://leetcode.com/problems/maximum-subarray/',                 category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 3 },
  { id: 'nc-jump-game',                    title: 'Jump Game',                       slug: 'jump-game',                        url: 'https://leetcode.com/problems/jump-game/',                        category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 5 },
  { id: 'nc-jump-game-ii',                 title: 'Jump Game II',                    slug: 'jump-game-ii',                     url: 'https://leetcode.com/problems/jump-game-ii/',                     category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 6 },
  { id: 'nc-gas-station',                  title: 'Gas Station',                     slug: 'gas-station',                      url: 'https://leetcode.com/problems/gas-station/',                      category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 6 },
  { id: 'nc-hand-of-straights',            title: 'Hand of Straights',               slug: 'hand-of-straights',                url: 'https://leetcode.com/problems/hand-of-straights/',                category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 6 },
  { id: 'nc-merge-triplets-to-form-target-triplet', title: 'Merge Triplets to Form Target Triplet', slug: 'merge-triplets-to-form-target-triplet', url: 'https://leetcode.com/problems/merge-triplets-to-form-target-triplet/', category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 6 },
  { id: 'nc-partition-labels',             title: 'Partition Labels',                slug: 'partition-labels',                 url: 'https://leetcode.com/problems/partition-labels/',                 category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 7 },
  { id: 'nc-valid-parenthesis-string',     title: 'Valid Parenthesis String',        slug: 'valid-parenthesis-string',         url: 'https://leetcode.com/problems/valid-parenthesis-string/',         category: 'Greedy', difficulty: 'Medium', estMinutes: 25, weekNumber: 6, dayNumber: 7 },

  // ═══════════════════════════════════════════════════════════════
  // WEEK 7: Tries (3) + Bit Manipulation (7) + Math & Geometry (8) = 18
  // ═══════════════════════════════════════════════════════════════

  // --- Tries (3) ---
  { id: 'nc-implement-trie-prefix-tree',   title: 'Implement Trie Prefix Tree',      slug: 'implement-trie-prefix-tree',       url: 'https://leetcode.com/problems/implement-trie-prefix-tree/',       category: 'Tries', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 1 },
  { id: 'nc-design-add-and-search-words-data-structure', title: 'Design Add and Search Words Data Structure', slug: 'design-add-and-search-words-data-structure', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', category: 'Tries', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 1 },
  { id: 'nc-word-search-ii',               title: 'Word Search II',                  slug: 'word-search-ii',                   url: 'https://leetcode.com/problems/word-search-ii/',                   category: 'Tries', difficulty: 'Hard',   estMinutes: 40, weekNumber: 7, dayNumber: 7 },

  // --- Bit Manipulation (7) ---
  { id: 'nc-single-number',                title: 'Single Number',                   slug: 'single-number',                    url: 'https://leetcode.com/problems/single-number/',                    category: 'Bit Manipulation', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 1 },
  { id: 'nc-number-of-1-bits',             title: 'Number of 1 Bits',                slug: 'number-of-1-bits',                 url: 'https://leetcode.com/problems/number-of-1-bits/',                 category: 'Bit Manipulation', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 2 },
  { id: 'nc-counting-bits',                title: 'Counting Bits',                   slug: 'counting-bits',                    url: 'https://leetcode.com/problems/counting-bits/',                    category: 'Bit Manipulation', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 2 },
  { id: 'nc-reverse-bits',                 title: 'Reverse Bits',                    slug: 'reverse-bits',                     url: 'https://leetcode.com/problems/reverse-bits/',                     category: 'Bit Manipulation', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 3 },
  { id: 'nc-missing-number',               title: 'Missing Number',                  slug: 'missing-number',                   url: 'https://leetcode.com/problems/missing-number/',                   category: 'Bit Manipulation', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 3 },
  { id: 'nc-sum-of-two-integers',          title: 'Sum of Two Integers',             slug: 'sum-of-two-integers',              url: 'https://leetcode.com/problems/sum-of-two-integers/',              category: 'Bit Manipulation', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 4 },
  { id: 'nc-reverse-integer',              title: 'Reverse Integer',                 slug: 'reverse-integer',                  url: 'https://leetcode.com/problems/reverse-integer/',                  category: 'Bit Manipulation', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 4 },

  // --- Math & Geometry (8) ---
  { id: 'nc-rotate-image',                 title: 'Rotate Image',                    slug: 'rotate-image',                     url: 'https://leetcode.com/problems/rotate-image/',                     category: 'Math & Geometry', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 5 },
  { id: 'nc-spiral-matrix',                title: 'Spiral Matrix',                   slug: 'spiral-matrix',                    url: 'https://leetcode.com/problems/spiral-matrix/',                    category: 'Math & Geometry', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 5 },
  { id: 'nc-set-matrix-zeroes',            title: 'Set Matrix Zeroes',               slug: 'set-matrix-zeroes',                url: 'https://leetcode.com/problems/set-matrix-zeroes/',                category: 'Math & Geometry', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 5 },
  { id: 'nc-happy-number',                 title: 'Happy Number',                    slug: 'happy-number',                     url: 'https://leetcode.com/problems/happy-number/',                     category: 'Math & Geometry', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 2 },
  { id: 'nc-plus-one',                     title: 'Plus One',                        slug: 'plus-one',                         url: 'https://leetcode.com/problems/plus-one/',                         category: 'Math & Geometry', difficulty: 'Easy',   estMinutes: 15, weekNumber: 7, dayNumber: 3 },
  { id: 'nc-pow-x-n',                      title: 'Pow(x n)',                        slug: 'powx-n',                           url: 'https://leetcode.com/problems/powx-n/',                           category: 'Math & Geometry', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 6 },
  { id: 'nc-multiply-strings',             title: 'Multiply Strings',                slug: 'multiply-strings',                 url: 'https://leetcode.com/problems/multiply-strings/',                 category: 'Math & Geometry', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 6 },
  { id: 'nc-detect-squares',               title: 'Detect Squares',                  slug: 'detect-squares',                   url: 'https://leetcode.com/problems/detect-squares/',                   category: 'Math & Geometry', difficulty: 'Medium', estMinutes: 25, weekNumber: 7, dayNumber: 7 },
];
