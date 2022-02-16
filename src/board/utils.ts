import { files, ranks } from './board-state';
import { coord, file, rank } from './types';

/**
 * Gets the distance between two files
 * @param from 
 * @param to 
 * @returns 
 */
export const distanceBetweenFiles = (from: file, to: file) => Math.abs(files.indexOf(from) - files.indexOf(to));

/**
 * Gets the file that is [count] many files from the file provided
 * @param file 
 * @param count 
 * @returns 
 */
export const getFileFrom = (file: file, count: number): file => {
    const fileIndex = files.indexOf(file);
    return files[fileIndex + count];
}

/**
 * Gets the rank that is [count] many ranks from the rank provided
 * @param rank 
 * @param count 
 * @returns 
 */
export const getRankFrom = (rank: rank, count: number): rank => {
    const rankIndex = ranks.indexOf(rank);
    return ranks[rankIndex + count];
}

/**
 * Gets the coordinate { file, rank } of the square [fileCount] and [rankCount] away from the given square
 */
export const getSquareFrom = (fromFile: file, fileCount: number, fromRank: rank, rankCount: number): coord | undefined => {
   const file = getFileFrom(fromFile, fileCount);
   const rank = getRankFrom(fromRank, rankCount);
   if (file && rank) {
       return { file, rank };
   }
}
