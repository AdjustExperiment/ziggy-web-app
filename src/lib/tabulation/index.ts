/**
 * Tabulation System - Advanced Tournament Management
 *
 * This module provides Tabbycat-style tournament tabulation features including:
 * - Power pairing with bracket management
 * - Munkres algorithm for optimal assignments
 * - Side balance tracking
 * - Conflict resolution
 * - Break generation with AIDA rules support
 * - Judge allocation
 * - Tiebreaker calculation engine
 */

export * from './drawGenerator';
export * from './munkres';
export * from './breakGenerator';
export * from './judgeAllocator';
export * from './tiebreakerEngine';
