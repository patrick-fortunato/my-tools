import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface DiffLine {
  lineNumLeft: number | null;
  lineNumRight: number | null;
  contentLeft: string;
  contentRight: string;
  type: 'unchanged' | 'added' | 'removed' | 'changed';
}

@Component({
  selector: 'app-diff-tool',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './diff-tool.component.html',
  styleUrl: './diff-tool.component.scss',
})
export class DiffToolComponent {
  leftInput = '';
  rightInput = '';
  diffResult: DiffLine[] = [];
  hasCompared = false;

  compare(): void {
    const leftLines = this.leftInput.split('\n');
    const rightLines = this.rightInput.split('\n');
    this.diffResult = this.computeDiff(leftLines, rightLines);
    this.hasCompared = true;
  }

  clear(): void {
    this.leftInput = '';
    this.rightInput = '';
    this.diffResult = [];
    this.hasCompared = false;
  }

  private computeDiff(leftLines: string[], rightLines: string[]): DiffLine[] {
    const result: DiffLine[] = [];
    const maxLen = Math.max(leftLines.length, rightLines.length);
    let leftNum = 1;
    let rightNum = 1;

    // Simple LCS-based diff
    const lcs = this.buildLCS(leftLines, rightLines);
    let i = 0;
    let j = 0;
    let k = 0;

    while (i < leftLines.length || j < rightLines.length) {
      if (k < lcs.length && i < leftLines.length && j < rightLines.length && leftLines[i] === lcs[k] && rightLines[j] === lcs[k]) {
        // Unchanged line
        result.push({
          lineNumLeft: leftNum++,
          lineNumRight: rightNum++,
          contentLeft: leftLines[i],
          contentRight: rightLines[j],
          type: 'unchanged',
        });
        i++;
        j++;
        k++;
      } else if (k < lcs.length && i < leftLines.length && leftLines[i] !== lcs[k]) {
        // Check if right also differs — that means it's a change
        if (j < rightLines.length && rightLines[j] !== (lcs[k] ?? '')) {
          result.push({
            lineNumLeft: leftNum++,
            lineNumRight: rightNum++,
            contentLeft: leftLines[i],
            contentRight: rightLines[j],
            type: 'changed',
          });
          i++;
          j++;
        } else {
          // Only left differs — removal
          result.push({
            lineNumLeft: leftNum++,
            lineNumRight: null,
            contentLeft: leftLines[i],
            contentRight: '',
            type: 'removed',
          });
          i++;
        }
      } else if (k < lcs.length && j < rightLines.length && rightLines[j] !== lcs[k]) {
        // Only right differs — addition
        result.push({
          lineNumLeft: null,
          lineNumRight: rightNum++,
          contentLeft: '',
          contentRight: rightLines[j],
          type: 'added',
        });
        j++;
      } else if (i < leftLines.length && j < rightLines.length) {
        // Both remain but no more LCS entries
        result.push({
          lineNumLeft: leftNum++,
          lineNumRight: rightNum++,
          contentLeft: leftLines[i],
          contentRight: rightLines[j],
          type: leftLines[i] === rightLines[j] ? 'unchanged' : 'changed',
        });
        i++;
        j++;
      } else if (i < leftLines.length) {
        result.push({
          lineNumLeft: leftNum++,
          lineNumRight: null,
          contentLeft: leftLines[i],
          contentRight: '',
          type: 'removed',
        });
        i++;
      } else if (j < rightLines.length) {
        result.push({
          lineNumLeft: null,
          lineNumRight: rightNum++,
          contentLeft: '',
          contentRight: rightLines[j],
          type: 'added',
        });
        j++;
      }
    }

    return result;
  }

  private buildLCS(left: string[], right: string[]): string[] {
    const m = left.length;
    const n = right.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (left[i - 1] === right[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find LCS
    const lcs: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (left[i - 1] === right[j - 1]) {
        lcs.unshift(left[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }
}
