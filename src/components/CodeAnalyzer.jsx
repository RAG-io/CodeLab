import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

// Comprehensive code analysis rules (ESLint-like)
const analyzeCode = (code) => {
  const issues = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip empty lines and pure comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }
    
    // === ERRORS (Serious Issues) ===
    
    // Check for var usage
    if (/\bvar\s+/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        rule: 'no-var',
        message: 'Use let or const instead of var',
      });
    }
    
    // Check for debugger statements
    if (/\bdebugger\b/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        rule: 'no-debugger',
        message: 'Unexpected debugger statement',
      });
    }
    
    // Check for eval usage
    if (/\beval\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        rule: 'no-eval',
        message: 'eval is harmful - avoid using it',
      });
    }
    
    // Check for with statement
    if (/\bwith\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        rule: 'no-with',
        message: 'Unexpected use of with statement',
      });
    }
    
    // Check for document.write
    if (/document\.write\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'error',
        rule: 'no-document-write',
        message: 'Avoid using document.write',
      });
    }
    
    // Check for implicit global variables (assignment without declaration)
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^=]/.test(trimmed) && 
        !trimmed.includes('const ') && !trimmed.includes('let ') && 
        !trimmed.includes('var ') && !trimmed.includes('.') &&
        !trimmed.includes('[') && !trimmed.includes('this.')) {
      issues.push({
        line: lineNum,
        severity: 'error',
        rule: 'no-implicit-globals',
        message: 'Implicit global variable - use let, const, or var',
      });
    }
    
    // === WARNINGS ===
    
    // Check for console.log
    if (/console\.(log|warn|error|info|debug|trace)\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-console',
        message: 'Unexpected console statement',
      });
    }
    
    // Check for == instead of ===
    if (/[^=!<>]==[^=]/.test(line) && !line.includes('===')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'eqeqeq',
        message: 'Use === instead of ==',
      });
    }
    
    // Check for != instead of !==
    if (/!=[^=]/.test(line) && !line.includes('!==')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'eqeqeq',
        message: 'Use !== instead of !=',
      });
    }
    
    // Check for empty catch blocks
    if (/catch\s*\([^)]*\)\s*{\s*}/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-empty',
        message: 'Empty catch block',
      });
    }
    
    // Check for alert statements
    if (/\balert\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-alert',
        message: 'Unexpected alert statement',
      });
    }
    
    // Check for confirm statements
    if (/\bconfirm\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-alert',
        message: 'Unexpected confirm statement',
      });
    }
    
    // Check for prompt statements
    if (/\bprompt\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-alert',
        message: 'Unexpected prompt statement',
      });
    }
    
    // Check for new Array() - prefer []
    if (/new\s+Array\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-array-constructor',
        message: 'Use array literal [] instead of new Array()',
      });
    }
    
    // Check for new Object() - prefer {}
    if (/new\s+Object\s*\(/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-object-constructor',
        message: 'Use object literal {} instead of new Object()',
      });
    }
    
    // Check for unnecessary semicolons
    if (/;{2,}/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-extra-semi',
        message: 'Unnecessary semicolon',
      });
    }
    
    // Check for parseInt without radix
    if (/parseInt\s*\([^,)]+\)/.test(line) && !/parseInt\s*\([^,)]+,[^)]+\)/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'radix',
        message: 'Missing radix parameter in parseInt',
      });
    }
    
    // Check for missing semicolons (comprehensive check)
    const shouldHaveSemicolon = (
      // Variable declarations
      (/^\s*(const|let|var)\s+\w+\s*=/.test(line) && !line.includes('=>') && !trimmed.endsWith(',')) ||
      // Return statements with value
      (/^\s*return\s+[^{]/.test(line) && !trimmed.endsWith('{')) ||
      // throw statements
      (/^\s*throw\s+/.test(line)) ||
      // break/continue
      (/^\s*(break|continue)\s*$/.test(trimmed) && !trimmed.endsWith(';')) ||
      // Method calls like obj.method()
      (/\)\s*$/.test(trimmed) && !trimmed.includes('function') && !trimmed.includes('=>') && 
       !trimmed.includes('if') && !trimmed.includes('while') && !trimmed.includes('for') &&
       !trimmed.includes('catch') && !trimmed.includes('switch'))
    );
    
    if (shouldHaveSemicolon && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith(',')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'semi',
        message: 'Missing semicolon',
      });
    }
    
    // Check for assignment in condition
    if (/if\s*\([^=]*[^=!<>]=[^=][^)]*\)/.test(line) && !/if\s*\([^=]*==/.test(line) && !/if\s*\([^=]*===/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-cond-assign',
        message: 'Assignment in conditional expression',
      });
    }
    
    // Check for duplicate keys in objects (basic check)
    const keyMatches = line.match(/(['"]?)(\w+)\1\s*:/g);
    if (keyMatches) {
      const keys = keyMatches.map(k => k.replace(/['":\s]/g, ''));
      const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
      if (duplicates.length > 0) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          rule: 'no-dupe-keys',
          message: `Duplicate key '${duplicates[0]}'`,
        });
      }
    }
    
    // Check for unused expressions (standalone variable without assignment)
    if (/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*;?\s*$/.test(line) && !trimmed.endsWith('{')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-unused-expressions',
        message: 'Expected an assignment or function call',
      });
    }
    
    // Check for ++ and -- operators
    if (/(\+\+|--)/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-plusplus',
        message: 'Consider using += 1 or -= 1 instead of ++ or --',
      });
    }
    
    // Check for nested ternary
    if (/\?[^:]*\?/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        rule: 'no-nested-ternary',
        message: 'Nested ternary expressions are confusing',
      });
    }
    
    // === INFO (Style/Best Practices) ===
    
    // Check for trailing whitespace
    if (/\s+$/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-trailing-spaces',
        message: 'Trailing whitespace detected',
      });
    }
    
    // Check for line too long
    if (line.length > 100) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'max-len',
        message: `Line too long (${line.length} > 100 characters)`,
      });
    }
    
    // Check for TODO comments
    if (/\/\/\s*TODO/i.test(line) || /\/\*.*TODO.*\*\//i.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-warning-comments',
        message: 'TODO comment found',
      });
    }
    
    // Check for FIXME comments
    if (/\/\/\s*FIXME/i.test(line) || /\/\*.*FIXME.*\*\//i.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-warning-comments',
        message: 'FIXME comment found',
      });
    }
    
    // Check for magic numbers
    const magicNumberMatch = line.match(/[^0-9a-zA-Z_.]([2-9]|[1-9][0-9]+)(?![0-9a-zA-Z_])/);
    if (magicNumberMatch && !line.includes('const') && !line.includes('let') && 
        !trimmed.startsWith('//') && !trimmed.startsWith('case ')) {
      const num = parseInt(magicNumberMatch[1]);
      if (num > 2 && !line.includes('index') && !line.includes('length') && !line.includes('px') && !line.includes('rem')) {
        issues.push({
          line: lineNum,
          severity: 'info',
          rule: 'no-magic-numbers',
          message: `Magic number ${num} - consider using a named constant`,
        });
      }
    }
    
    // Check for multiple empty lines (if previous line was also empty)
    if (index > 0 && !trimmed && !lines[index - 1].trim()) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-multiple-empty-lines',
        message: 'Multiple consecutive empty lines',
      });
    }
    
    // Check for spaces inside brackets
    if (/\[\s+/.test(line) || /\s+\]/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'array-bracket-spacing',
        message: 'Unexpected space inside brackets',
      });
    }
    
    // Check for inconsistent spacing around operators
    if (/\w[+\-*/%]=\w/.test(line) || /\w=[+\-*/%]\w/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'space-infix-ops',
        message: 'Missing spaces around operator',
      });
    }
    
    // Check for tabs (prefer spaces)
    if (/\t/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-tabs',
        message: 'Unexpected tab character - use spaces for indentation',
      });
    }
    
    // Check for function without name in declaration
    if (/function\s*\(\s*\)/.test(line) && !line.includes('function()') && !line.includes('=>')) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'func-names',
        message: 'Consider using a named function for better debugging',
      });
    }
    
    // Check for single quotes vs double quotes (prefer single)
    if (/"[^"]*"/.test(line) && !line.includes("'") && !line.includes('import') && !line.includes('require')) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'quotes',
        message: 'Consider using single quotes instead of double quotes',
      });
    }
    
    // Check for commented out code
    if (/\/\/\s*(const|let|var|function|if|for|while|return)\s/.test(line)) {
      issues.push({
        line: lineNum,
        severity: 'info',
        rule: 'no-commented-code',
        message: 'Commented out code - consider removing',
      });
    }
    
    // Check for async function without await
    if (/async\s+function/.test(line) || /async\s*\(/.test(line) || /async\s*=>/.test(line)) {
      // Check if any following lines in the function have await
      let hasAwait = false;
      for (let j = index; j < Math.min(index + 20, lines.length); j++) {
        if (lines[j].includes('await')) {
          hasAwait = true;
          break;
        }
        if (j > index && /^\s*}/.test(lines[j])) {
          break;
        }
      }
      if (!hasAwait) {
        issues.push({
          line: lineNum,
          severity: 'info',
          rule: 'require-await',
          message: 'Async function without await expression',
        });
      }
    }
  });
  
  // Sort by severity (errors first, then warnings, then info), then by line
  const severityOrder = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.line - b.line;
  });
  
  return issues;
};

const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'info':
      return <Info className="h-4 w-4 text-info" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getSeverityStyle = (severity) => {
  switch (severity) {
    case 'error':
      return 'bg-destructive/10 border-destructive/30 text-destructive';
    case 'warning':
      return 'bg-warning/10 border-warning/30 text-warning';
    case 'info':
      return 'bg-info/10 border-info/30 text-info';
    default:
      return 'bg-muted border-border';
  }
};

export default function CodeAnalyzer({ code, onAnalysisComplete }) {
  const [issues, setIssues] = useState([]);
  
  useEffect(() => {
    if (code) {
      const analysisResults = analyzeCode(code);
      setIssues(analysisResults);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResults);
      }
    } else {
      setIssues([]);
      if (onAnalysisComplete) {
        onAnalysisComplete([]);
      }
    }
  }, [code, onAnalysisComplete]);
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {issues.length === 0 ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">No issues found</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">Analysis Results:</span>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> {errorCount} errors
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" /> {warningCount} warnings
                </span>
              )}
              {infoCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-info">
                  <Info className="h-4 w-4" /> {infoCount} hints
                </span>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-2 rounded border ${getSeverityStyle(issue.severity)}`}
            >
              {getSeverityIcon(issue.severity)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-background/50">
                    Line {issue.line}
                  </span>
                  <code className="text-xs opacity-70">{issue.rule}</code>
                </div>
                <p className="text-sm mt-0.5">{issue.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
