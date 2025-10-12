package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// tygo:emit
// AuditLog represents system audit trail for all entity changes
type AuditLog struct {
	BaseModel
	// Entity information
	TableName string    `gorm:"type:varchar(100);not null;index" json:"tableName"`
	RecordID  uuid.UUID `gorm:"type:uuid;not null;index" json:"recordId"`

	// Action details
	Action     string `gorm:"type:varchar(50);not null;index" json:"action"` // create, update, delete, restore
	ActionType string `gorm:"type:varchar(50);not null" json:"actionType"`   // manual, system, automated

	// User and context
	UserID *uuid.UUID `gorm:"type:uuid;index" json:"userId,omitempty"`
	User   *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Change data
	OldData       json.RawMessage `gorm:"type:jsonb" json:"oldData,omitempty"`
	NewData       json.RawMessage `gorm:"type:jsonb" json:"newData,omitempty"`
	ChangedFields json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"changedFields"`

	// Request context
	IPAddress string  `gorm:"type:varchar(45)" json:"ipAddress"`
	UserAgent string  `gorm:"type:text" json:"userAgent"`
	RequestID *string `gorm:"type:varchar(100)" json:"requestId,omitempty"`
	SessionID *string `gorm:"type:varchar(200)" json:"sessionId,omitempty"`

	// Additional context
	Reason *string `gorm:"type:text" json:"reason,omitempty"`
	Source string  `gorm:"type:varchar(100);default:'web'" json:"source"` // web, api, mobile, system
	Module string  `gorm:"type:varchar(100)" json:"module"`

	// Metadata and tags
	Tags     json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"tags"`
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	// Timing
	ActionedAt time.Time `gorm:"not null;index" json:"actionedAt"`
}

// tygo:emit
// SystemEvent represents significant system events and activities
type SystemEvent struct {
	BaseModel
	// Event identification
	EventType string `gorm:"type:varchar(100);not null;index" json:"eventType"`
	EventName string `gorm:"type:varchar(200);not null" json:"eventName"`
	EventCode string `gorm:"type:varchar(100)" json:"eventCode"`

	// Event categorization
	Category string `gorm:"type:varchar(100);not null;index" json:"category"`
	Severity string `gorm:"type:varchar(50);not null;index" json:"severity"` // info, warning, error, critical
	Priority string `gorm:"type:varchar(50);default:'normal'" json:"priority"`

	// Context
	UserID    *uuid.UUID `gorm:"type:uuid;index" json:"userId,omitempty"`
	User      *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CollageID *uuid.UUID `gorm:"type:uuid;index" json:"collageId,omitempty"`

	// Event details
	Description string          `gorm:"type:text;not null" json:"description"`
	Details     json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"details"`

	// Related entities
	RelatedEntityType *string    `gorm:"type:varchar(100)" json:"relatedEntityType,omitempty"`
	RelatedEntityID   *uuid.UUID `gorm:"type:uuid" json:"relatedEntityId,omitempty"`

	// Request context
	IPAddress *string `gorm:"type:varchar(45)" json:"ipAddress,omitempty"`
	UserAgent *string `gorm:"type:text" json:"userAgent,omitempty"`
	RequestID *string `gorm:"type:varchar(100)" json:"requestId,omitempty"`

	// Status and resolution
	Status     string     `gorm:"type:varchar(50);default:'open'" json:"status"`
	IsResolved bool       `gorm:"default:false" json:"isResolved"`
	ResolvedAt *time.Time `json:"resolvedAt,omitempty"`
	ResolvedBy *uuid.UUID `gorm:"type:uuid" json:"resolvedBy,omitempty"`
	Resolution *string    `gorm:"type:text" json:"resolution,omitempty"`

	// Notification and alerting
	IsNotified bool       `gorm:"default:false" json:"isNotified"`
	NotifiedAt *time.Time `json:"notifiedAt,omitempty"`
	AlertSent  bool       `gorm:"default:false" json:"alertSent"`

	// Additional information
	Source   string          `gorm:"type:varchar(100);default:'system'" json:"source"`
	Tags     json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"tags"`
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	// Timing
	OccurredAt time.Time `gorm:"not null;index" json:"occurredAt"`
}

// tygo:emit
// DataRetentionPolicy represents data retention and cleanup policies
type DataRetentionPolicy struct {
	BaseModel
	// Policy identification
	PolicyName string `gorm:"type:varchar(200);not null;uniqueIndex" json:"policyName"`
	PolicyType string `gorm:"type:varchar(100);not null" json:"policyType"`

	// Target configuration
	TableName  string `gorm:"type:varchar(100);not null" json:"tableName"`
	EntityType string `gorm:"type:varchar(100);not null" json:"entityType"`

	// Retention rules
	RetentionPeriodDays int             `gorm:"type:int;not null" json:"retentionPeriodDays"`
	RetentionCriteria   json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"retentionCriteria"`

	// Cleanup configuration
	CleanupAction   string  `gorm:"type:varchar(50);not null" json:"cleanupAction"` // delete, archive, anonymize
	ArchiveLocation *string `gorm:"type:varchar(500)" json:"archiveLocation,omitempty"`

	// Schedule and execution
	IsActive        bool       `gorm:"default:true" json:"isActive"`
	ScheduleCron    string     `gorm:"type:varchar(100)" json:"scheduleCron"`
	LastExecutedAt  *time.Time `json:"lastExecutedAt,omitempty"`
	NextExecutionAt *time.Time `json:"nextExecutionAt,omitempty"`

	// Execution tracking
	ExecutionCount       int `gorm:"default:0" json:"executionCount"`
	LastRecordsProcessed int `gorm:"default:0" json:"lastRecordsProcessed"`
	LastRecordsDeleted   int `gorm:"default:0" json:"lastRecordsDeleted"`

	// Additional configuration

	Notes    *string         `gorm:"type:text" json:"notes,omitempty"`
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`
}

// tygo:emit
// ComplianceLog represents compliance and regulatory audit logs
type ComplianceLog struct {
	BaseModel
	// Compliance identification
	ComplianceType  string `gorm:"type:varchar(100);not null;index" json:"complianceType"`
	Regulation      string `gorm:"type:varchar(100);not null" json:"regulation"`
	RequirementCode string `gorm:"type:varchar(100)" json:"requirementCode"`

	// Entity and action
	EntityType string    `gorm:"type:varchar(100);not null" json:"entityType"`
	EntityID   uuid.UUID `gorm:"type:uuid;not null;index" json:"entityId"`
	Action     string    `gorm:"type:varchar(100);not null" json:"action"`

	// Context
	UserID *uuid.UUID `gorm:"type:uuid;index" json:"userId,omitempty"`
	User   *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Compliance details
	ComplianceStatus string          `gorm:"type:varchar(50);not null" json:"complianceStatus"` // compliant, non_compliant, pending
	Evidence         json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"evidence"`

	// Violation details (if non-compliant)
	ViolationType    *string `gorm:"type:varchar(100)" json:"violationType,omitempty"`
	ViolationDetails *string `gorm:"type:text" json:"violationDetails,omitempty"`
	RiskLevel        *string `gorm:"type:varchar(50)" json:"riskLevel,omitempty"`

	// Remediation
	RemediationRequired bool       `gorm:"default:false" json:"remediationRequired"`
	RemediationPlan     *string    `gorm:"type:text" json:"remediationPlan,omitempty"`
	RemediationDeadline *time.Time `json:"remediationDeadline,omitempty"`
	RemediationStatus   *string    `gorm:"type:varchar(50)" json:"remediationStatus,omitempty"`

	// Additional information
	Notes    *string         `gorm:"type:text" json:"notes,omitempty"`
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	// Timing
	CheckedAt time.Time `gorm:"not null;index" json:"checkedAt"`
}

// tygo:emit
// SecurityEvent represents security-related events and incidents
type SecurityEvent struct {
	BaseModel
	// Event identification
	EventType    string `gorm:"type:varchar(100);not null;index" json:"eventType"`
	EventSubtype string `gorm:"type:varchar(100)" json:"eventSubtype"`
	ThreatLevel  string `gorm:"type:varchar(50);not null;index" json:"threatLevel"` // low, medium, high, critical

	// Context
	UserID *uuid.UUID `gorm:"type:uuid;index" json:"userId,omitempty"`
	User   *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`

	Description  string          `gorm:"type:text;not null" json:"description"`
	EventDetails json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"eventDetails"`

	// Source information
	SourceIP  string  `gorm:"type:varchar(45)" json:"sourceIp"`
	UserAgent *string `gorm:"type:text" json:"userAgent,omitempty"`
	Location  *string `gorm:"type:varchar(200)" json:"location,omitempty"`

	// Attack information
	AttackVector    *string `gorm:"type:varchar(100)" json:"attackVector,omitempty"`
	AttackSignature *string `gorm:"type:text" json:"attackSignature,omitempty"`
	PayloadData     *string `gorm:"type:text" json:"payloadData,omitempty"`

	// Impact assessment
	ImpactLevel     string          `gorm:"type:varchar(50)" json:"impactLevel"`
	AffectedSystems json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"affectedSystems"`
	DataCompromised bool            `gorm:"default:false" json:"dataCompromised"`

	// Response and mitigation
	IsBlocked         bool            `gorm:"default:false" json:"isBlocked"`
	BlockedAt         *time.Time      `json:"blockedAt,omitempty"`
	MitigationActions json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"mitigationActions"`

	// Investigation
	IsInvestigated     bool       `gorm:"default:false" json:"isInvestigated"`
	InvestigatedBy     *uuid.UUID `gorm:"type:uuid" json:"investigatedBy,omitempty"`
	InvestigatedAt     *time.Time `json:"investigatedAt,omitempty"`
	InvestigationNotes *string    `gorm:"type:text" json:"investigationNotes,omitempty"`

	// Status and resolution
	Status     string     `gorm:"type:varchar(50);default:'open'" json:"status"`
	IsResolved bool       `gorm:"default:false" json:"isResolved"`
	ResolvedAt *time.Time `json:"resolvedAt,omitempty"`
	Resolution *string    `gorm:"type:text" json:"resolution,omitempty"`

	// Additional information
	Tags     json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"tags"`
	Metadata json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	// Timing
	DetectedAt time.Time `gorm:"not null;index" json:"detectedAt"`
}

// AuditLog methods
func (al *AuditLog) IsRecentChange(hours int) bool {
	return time.Since(al.ActionedAt) <= time.Duration(hours)*time.Hour
}

func (al *AuditLog) IsUserAction() bool {
	return al.UserID != nil && al.ActionType == "manual"
}

func (al *AuditLog) IsSystemAction() bool {
	return al.ActionType == "system" || al.ActionType == "automated"
}

func (al *AuditLog) HasChangedFields() bool {
	// Implementation would check if ChangedFields JSON array has items
	return len(al.ChangedFields) > 2 // More than empty array "[]"
}

func (al *AuditLog) GetChangeCount() int {
	// Implementation would count items in ChangedFields JSON array
	return 0 // Placeholder
}

// SystemEvent methods
func (se *SystemEvent) IsCritical() bool {
	return se.Severity == "critical"
}

func (se *SystemEvent) IsError() bool {
	return se.Severity == "error" || se.Severity == "critical"
}

func (se *SystemEvent) RequiresAttention() bool {
	return !se.IsResolved && (se.Severity == "error" || se.Severity == "critical")
}

func (se *SystemEvent) IsOverdue() bool {
	if se.IsResolved {
		return false
	}
	// Events older than 24 hours for critical, 72 hours for error
	threshold := 72 * time.Hour
	if se.Severity == "critical" {
		threshold = 24 * time.Hour
	}
	return time.Since(se.OccurredAt) > threshold
}

func (se *SystemEvent) CanResolve(userID uuid.UUID) bool {
	return !se.IsResolved && se.Status == "open"
}

// DataRetentionPolicy methods
func (drp *DataRetentionPolicy) IsActivePolicy() bool {
	return drp.IsActive
}

func (drp *DataRetentionPolicy) IsDue() bool {
	if drp.NextExecutionAt == nil {
		return true
	}
	return time.Now().After(*drp.NextExecutionAt)
}

func (drp *DataRetentionPolicy) GetRetentionCutoffDate() time.Time {
	return time.Now().AddDate(0, 0, -drp.RetentionPeriodDays)
}

func (drp *DataRetentionPolicy) ShouldArchive() bool {
	return drp.CleanupAction == "archive"
}

func (drp *DataRetentionPolicy) ShouldDelete() bool {
	return drp.CleanupAction == "delete"
}

// ComplianceLog methods
func (cl *ComplianceLog) IsCompliant() bool {
	return cl.ComplianceStatus == "compliant"
}

func (cl *ComplianceLog) IsNonCompliant() bool {
	return cl.ComplianceStatus == "non_compliant"
}

func (cl *ComplianceLog) RequiresRemediation() bool {
	return cl.RemediationRequired && cl.RemediationStatus != nil && *cl.RemediationStatus != "completed"
}

func (cl *ComplianceLog) IsRemediationOverdue() bool {
	if !cl.RequiresRemediation() || cl.RemediationDeadline == nil {
		return false
	}
	return time.Now().After(*cl.RemediationDeadline)
}

func (cl *ComplianceLog) GetRiskScore() int {
	switch *cl.RiskLevel {
	case "critical":
		return 4
	case "high":
		return 3
	case "medium":
		return 2
	case "low":
		return 1
	default:
		return 0
	}
}

// SecurityEvent methods
func (se *SecurityEvent) IsCriticalThreat() bool {
	return se.ThreatLevel == "critical"
}

func (se *SecurityEvent) IsHighThreat() bool {
	return se.ThreatLevel == "high" || se.ThreatLevel == "critical"
}

func (se *SecurityEvent) RequiresImmediateAction() bool {
	return se.IsCriticalThreat() && !se.IsResolved
}

func (se *SecurityEvent) IsActiveIncident() bool {
	return se.Status == "open" && !se.IsResolved
}

func (se *SecurityEvent) HasDataBreach() bool {
	return se.DataCompromised
}

func (se *SecurityEvent) IsBlockedEvent() bool {
	return se.IsBlocked && se.BlockedAt != nil
}

func (se *SecurityEvent) RequiresInvestigation() bool {
	return se.IsHighThreat() && !se.IsInvestigated
}

func (se *SecurityEvent) GetThreatScore() int {
	switch se.ThreatLevel {
	case "critical":
		return 4
	case "high":
		return 3
	case "medium":
		return 2
	case "low":
		return 1
	default:
		return 0
	}
}
