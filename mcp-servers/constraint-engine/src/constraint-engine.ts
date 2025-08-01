import { 
  Constraint, 
  FinancialMetric, 
  ConstraintViolation 
} from '@financial-analyzer/shared';

export interface EvaluationRequest {
  constraints: Constraint[];
  metrics: FinancialMetric[];
}

export interface EvaluationResult {
  violations: ConstraintViolation[];
  totalConstraints: number;
  violationsCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

// Use the shared Constraint type directly
export type ConstraintRule = Constraint;

export class ConstraintEngine {
  private constraints: Map<string, ConstraintRule> = new Map();

  /**
   * Add a constraint rule to the engine
   */
  addConstraint(constraint: ConstraintRule): void {
    this.constraints.set(constraint.id, constraint);
  }

  /**
   * Remove a constraint rule from the engine
   */
  removeConstraint(constraintId: string): boolean {
    return this.constraints.delete(constraintId);
  }

  /**
   * Update an existing constraint rule
   */
  updateConstraint(constraintId: string, updates: Partial<ConstraintRule>): boolean {
    const existing = this.constraints.get(constraintId);
    if (!existing) return false;

    const updated = { ...existing, ...updates };
    this.constraints.set(constraintId, updated);
    return true;
  }

  /**
   * Get a constraint rule by ID
   */
  getConstraint(constraintId: string): ConstraintRule | undefined {
    return this.constraints.get(constraintId);
  }

  /**
   * Get all constraint rules
   */
  getAllConstraints(): ConstraintRule[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Get active constraint rules only
   */
  getActiveConstraints(): ConstraintRule[] {
    return Array.from(this.constraints.values()).filter(c => c.isActive);
  }

  /**
   * Evaluate financial metrics against constraints
   */
  evaluate(metrics: FinancialMetric[], constraintIds?: string[]): EvaluationResult {
    const constraintsToEvaluate = constraintIds 
      ? constraintIds.map(id => this.constraints.get(id)).filter(Boolean) as ConstraintRule[]
      : this.getActiveConstraints();

    const violations: ConstraintViolation[] = [];
    
    for (const constraint of constraintsToEvaluate) {
      const matchingMetrics = metrics.filter(m => m.name === constraint.metric);
      
      for (const metric of matchingMetrics) {
        const violation = this.checkConstraint(constraint, metric);
        if (violation) {
          violations.push(violation);
        }
      }
    }

    // Count violations by severity
    const criticalCount = violations.filter(v => v.severity === 'critical').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const infoCount = violations.filter(v => v.severity === 'info').length;

    return {
      violations,
      totalConstraints: constraintsToEvaluate.length,
      violationsCount: violations.length,
      criticalCount,
      warningCount,
      infoCount,
    };
  }

  /**
   * Check a single constraint against a metric
   */
  private checkConstraint(constraint: ConstraintRule, metric: FinancialMetric): ConstraintViolation | null {
    const actualValue = metric.value;
    const expectedValue = constraint.value;
    const operator = constraint.operator;

    let isViolation = false;

    switch (operator) {
      case '<':
        isViolation = actualValue >= expectedValue;
        break;
      case '>':
        isViolation = actualValue <= expectedValue;
        break;
      case '=':
        isViolation = actualValue !== expectedValue;
        break;
      case '<=':
        isViolation = actualValue > expectedValue;
        break;
      case '>=':
        isViolation = actualValue < expectedValue;
        break;
      case '!=':
        isViolation = actualValue === expectedValue;
        break;
      default:
        return null; // Unknown operator
    }

    if (isViolation) {
      return {
        constraintId: constraint.id,
        metric: constraint.metric,
        actualValue,
        expectedValue,
        operator: constraint.operator,
        severity: constraint.severity,
        message: this.generateViolationMessage(constraint, actualValue, expectedValue),
      };
    }

    return null;
  }

  /**
   * Generate a human-readable violation message
   */
  private generateViolationMessage(
    constraint: ConstraintRule, 
    actualValue: number, 
    expectedValue: number
  ): string {
    const operatorText = this.getOperatorText(constraint.operator);
    
    return `${constraint.name}: ${constraint.metric} is ${actualValue}, expected ${operatorText} ${expectedValue}. ${constraint.message}`;
  }

  /**
   * Convert operator to human-readable text
   */
  private getOperatorText(operator: string): string {
    const operatorMap: Record<string, string> = {
      '<': 'less than',
      '>': 'greater than',
      '=': 'equal to',
      '<=': 'less than or equal to',
      '>=': 'greater than or equal to',
      '!=': 'not equal to',
    };

    return operatorMap[operator] || 'unknown';
  }

  /**
   * Validate constraint rule
   */
  validateConstraint(constraint: ConstraintRule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validOperators = ['<', '>', '=', '<=', '>=', '!='];
    const validSeverities = ['critical', 'warning', 'info'];

    if (!constraint.name || constraint.name.trim().length === 0) {
      errors.push('Constraint name is required');
    }

    if (!constraint.metric || constraint.metric.trim().length === 0) {
      errors.push('Metric name is required');
    }

    if (!validOperators.includes(constraint.operator)) {
      errors.push('Invalid operator');
    }

    if (typeof constraint.value !== 'number' || isNaN(constraint.value)) {
      errors.push('Value must be a valid number');
    }

    if (!validSeverities.includes(constraint.severity)) {
      errors.push('Invalid severity level');
    }

    if (!constraint.message || constraint.message.trim().length === 0) {
      errors.push('Constraint message is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get constraint statistics
   */
  getStatistics(): {
    totalConstraints: number;
    activeConstraints: number;
    inactiveConstraints: number;
    constraintsByMetric: Record<string, number>;
    constraintsBySeverity: Record<string, number>;
  } {
    const allConstraints = this.getAllConstraints();
    const activeConstraints = allConstraints.filter(c => c.isActive);
    
    const constraintsByMetric: Record<string, number> = {};
    const constraintsBySeverity: Record<string, number> = {};

    for (const constraint of allConstraints) {
      // Count by metric
      constraintsByMetric[constraint.metric] = (constraintsByMetric[constraint.metric] || 0) + 1;
      
      // Count by severity
      constraintsBySeverity[constraint.severity] = (constraintsBySeverity[constraint.severity] || 0) + 1;
    }

    return {
      totalConstraints: allConstraints.length,
      activeConstraints: activeConstraints.length,
      inactiveConstraints: allConstraints.length - activeConstraints.length,
      constraintsByMetric,
      constraintsBySeverity,
    };
  }

  /**
   * Clear all constraints
   */
  clearAllConstraints(): void {
    this.constraints.clear();
  }

  /**
   * Load constraints from array
   */
  loadConstraints(constraints: ConstraintRule[]): void {
    this.clearAllConstraints();
    for (const constraint of constraints) {
      this.addConstraint(constraint);
    }
  }
}