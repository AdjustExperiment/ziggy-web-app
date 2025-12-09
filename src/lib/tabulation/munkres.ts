/**
 * Munkres (Hungarian) Algorithm Implementation
 * Based on Tabbycat's munkres.py - solves the assignment problem for optimal pairings
 * 
 * Given an n×n cost matrix, finds the assignment of rows to columns that minimizes
 * total cost. Used for power pairing and judge allocation.
 */

export const DISALLOWED = Number.MAX_SAFE_INTEGER;

interface MunkresResult {
  assignment: [number, number][];
  totalCost: number;
}

/**
 * Pad a possibly non-square matrix to make it square.
 */
function padMatrix(matrix: number[][], padValue: number = 0): number[][] {
  const maxRows = matrix.length;
  const maxCols = Math.max(...matrix.map(row => row.length));
  const n = Math.max(maxRows, maxCols);
  
  const padded: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i < maxRows && j < (matrix[i]?.length || 0)) {
        row.push(matrix[i][j]);
      } else {
        row.push(padValue);
      }
    }
    padded.push(row);
  }
  return padded;
}

/**
 * Create a copy of a matrix
 */
function copyMatrix(matrix: number[][]): number[][] {
  return matrix.map(row => [...row]);
}

/**
 * The Munkres/Hungarian algorithm for solving the assignment problem.
 */
export class Munkres {
  private C: number[][] = [];
  private n: number = 0;
  private originalRows: number = 0;
  private originalCols: number = 0;
  private marked: number[][] = [];
  private rowCovered: boolean[] = [];
  private colCovered: boolean[] = [];
  private Z0Row: number = 0;
  private Z0Col: number = 0;
  private path: [number, number][] = [];

  /**
   * Compute the optimal assignment for a cost matrix.
   * 
   * @param costMatrix - n×m cost matrix (will be padded if not square)
   * @returns Array of [row, col] assignments and total cost
   */
  compute(costMatrix: number[][]): MunkresResult {
    if (costMatrix.length === 0) {
      return { assignment: [], totalCost: 0 };
    }

    this.originalRows = costMatrix.length;
    this.originalCols = Math.max(...costMatrix.map(row => row.length));
    
    // Pad to square matrix
    this.C = padMatrix(copyMatrix(costMatrix), 0);
    this.n = this.C.length;
    
    // Initialize marked matrix (0 = unmarked, 1 = starred, 2 = primed)
    this.marked = Array(this.n).fill(null).map(() => Array(this.n).fill(0));
    
    // Initialize cover arrays
    this.rowCovered = Array(this.n).fill(false);
    this.colCovered = Array(this.n).fill(false);
    
    // Run the algorithm steps
    let step = 1;
    const steps: { [key: number]: () => number } = {
      1: () => this.step1(),
      2: () => this.step2(),
      3: () => this.step3(),
      4: () => this.step4(),
      5: () => this.step5(),
      6: () => this.step6(),
    };
    
    while (step > 0 && step < 7) {
      step = steps[step]();
    }
    
    // Extract the assignment
    const assignment: [number, number][] = [];
    let totalCost = 0;
    
    for (let i = 0; i < this.originalRows; i++) {
      for (let j = 0; j < this.originalCols; j++) {
        if (this.marked[i][j] === 1) {
          assignment.push([i, j]);
          totalCost += costMatrix[i][j];
          break;
        }
      }
    }
    
    return { assignment, totalCost };
  }

  /**
   * Step 1: For each row, subtract the minimum value from all elements.
   */
  private step1(): number {
    for (let i = 0; i < this.n; i++) {
      const minVal = Math.min(...this.C[i]);
      if (minVal !== DISALLOWED) {
        for (let j = 0; j < this.n; j++) {
          if (this.C[i][j] !== DISALLOWED) {
            this.C[i][j] -= minVal;
          }
        }
      }
    }
    return 2;
  }

  /**
   * Step 2: Find zeros and star them if no other zeros are starred in the same row/col.
   */
  private step2(): number {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.C[i][j] === 0 && !this.rowCovered[i] && !this.colCovered[j]) {
          this.marked[i][j] = 1;
          this.rowCovered[i] = true;
          this.colCovered[j] = true;
        }
      }
    }
    this.clearCovers();
    return 3;
  }

  /**
   * Step 3: Cover all columns with starred zeros. If all columns covered, done.
   */
  private step3(): number {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.marked[i][j] === 1) {
          this.colCovered[j] = true;
        }
      }
    }
    
    const coveredCount = this.colCovered.filter(c => c).length;
    return coveredCount >= this.n ? 7 : 4;
  }

  /**
   * Step 4: Find an uncovered zero and prime it.
   */
  private step4(): number {
    while (true) {
      const [row, col] = this.findUncoveredZero();
      if (row === -1) {
        return 6;
      }
      
      this.marked[row][col] = 2;
      const starCol = this.findStarInRow(row);
      
      if (starCol !== -1) {
        this.rowCovered[row] = true;
        this.colCovered[starCol] = false;
      } else {
        this.Z0Row = row;
        this.Z0Col = col;
        return 5;
      }
    }
  }

  /**
   * Step 5: Construct series of alternating primed and starred zeros.
   */
  private step5(): number {
    this.path = [[this.Z0Row, this.Z0Col]];
    
    while (true) {
      const row = this.findStarInCol(this.path[this.path.length - 1][1]);
      if (row === -1) {
        break;
      }
      this.path.push([row, this.path[this.path.length - 1][1]]);
      
      const col = this.findPrimeInRow(row);
      this.path.push([row, col]);
    }
    
    this.augmentPath();
    this.clearCovers();
    this.erasePrimes();
    return 3;
  }

  /**
   * Step 6: Find the minimum uncovered value and adjust matrix.
   */
  private step6(): number {
    const minVal = this.findSmallestUncovered();
    
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.C[i][j] !== DISALLOWED) {
          if (this.rowCovered[i]) {
            this.C[i][j] += minVal;
          }
          if (!this.colCovered[j]) {
            this.C[i][j] -= minVal;
          }
        }
      }
    }
    return 4;
  }

  private findUncoveredZero(): [number, number] {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.C[i][j] === 0 && !this.rowCovered[i] && !this.colCovered[j]) {
          return [i, j];
        }
      }
    }
    return [-1, -1];
  }

  private findStarInRow(row: number): number {
    for (let j = 0; j < this.n; j++) {
      if (this.marked[row][j] === 1) {
        return j;
      }
    }
    return -1;
  }

  private findStarInCol(col: number): number {
    for (let i = 0; i < this.n; i++) {
      if (this.marked[i][col] === 1) {
        return i;
      }
    }
    return -1;
  }

  private findPrimeInRow(row: number): number {
    for (let j = 0; j < this.n; j++) {
      if (this.marked[row][j] === 2) {
        return j;
      }
    }
    return -1;
  }

  private findSmallestUncovered(): number {
    let minVal = DISALLOWED;
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (!this.rowCovered[i] && !this.colCovered[j] && this.C[i][j] < minVal) {
          minVal = this.C[i][j];
        }
      }
    }
    return minVal === DISALLOWED ? 0 : minVal;
  }

  private augmentPath(): void {
    for (const [row, col] of this.path) {
      this.marked[row][col] = this.marked[row][col] === 1 ? 0 : 1;
    }
  }

  private clearCovers(): void {
    this.rowCovered.fill(false);
    this.colCovered.fill(false);
  }

  private erasePrimes(): void {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.marked[i][j] === 2) {
          this.marked[i][j] = 0;
        }
      }
    }
  }
}

/**
 * Convenience function to solve assignment problem.
 */
export function computeOptimalAssignment(costMatrix: number[][]): MunkresResult {
  const munkres = new Munkres();
  return munkres.compute(costMatrix);
}
