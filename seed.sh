#!/usr/bin/env bash
# =============================================================================
# Asset Tracker — Seed Data Script
# =============================================================================
# Resets databases and populates them with demo data.
# Usage: ./seed.sh
# Prerequisites: docker, curl, python3
# =============================================================================
set -euo pipefail

# --- Configuration -----------------------------------------------------------
readonly GO_PORT="${GO_PORT:-8080}"
readonly NODE_PORT="${NODE_PORT:-3000}"
readonly GO_URL="http://localhost:${GO_PORT}"
readonly NODE_URL="http://localhost:${NODE_PORT}"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Counters
CREATED_DEVICES=0
CREATED_EVENTS=0
DELETED_DEVICES=0

# --- Helpers -----------------------------------------------------------------
info()  { echo -e "${CYAN}$1${NC}"; }
ok()    { echo -e "  ${GREEN}✅ $1${NC}"; }
warn()  { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
fail()  { echo -e "  ${RED}❌ $1${NC}"; }

# --- Prerequisites -----------------------------------------------------------
info "======================================"
info "  Asset Tracker — Seed Data Script"
info "======================================"
echo ""

info "🔍 Checking prerequisites..."

for cmd in curl python3 docker; do
  if ! command -v "$cmd" &>/dev/null; then
    fail "$cmd is required but not installed."
    exit 1
  fi
done
ok "All required tools available"

if ! docker info &>/dev/null; then
  fail "Docker is not running. Please start Docker."
  exit 1
fi
ok "Docker is running"

echo "  Checking Go service..."
if ! curl -sf "${GO_URL}/health" &>/dev/null; then
  fail "Go service not available at ${GO_URL}"
  echo "  Run 'docker compose up -d' first"
  exit 1
fi
ok "Go service is healthy"

echo "  Checking Node service..."
if ! curl -sf "${NODE_URL}/health" &>/dev/null; then
  fail "Node service not available at ${NODE_URL}"
  echo "  Run 'docker compose up -d' first"
  exit 1
fi
ok "Node service is healthy"
echo ""

# --- Clean databases ---------------------------------------------------------
info "🧹 Cleaning databases..."

echo "  Cleaning PostgreSQL..."
if docker compose exec -T postgres psql -U postgres -d asset_tracker -c "DELETE FROM devices;" 2>/dev/null; then
  ok "PostgreSQL cleaned"
else
  warn "Could not clean PostgreSQL via docker compose (may not be in container)"
  warn "Will continue — devices will be recreated"
fi

echo "  Cleaning MongoDB..."
if docker compose exec -T mongo mongosh \
  "mongodb://mongo:changeme@localhost:27017/asset_tracker?authSource=admin" \
  --quiet --eval "db.events.deleteMany({});" 2>/dev/null; then
  ok "MongoDB cleaned"
else
  warn "Could not clean MongoDB via docker compose"
fi
echo ""

# --- Login -------------------------------------------------------------------
info "🔑 Logging in..."

LOGIN_RESPONSE=$(curl -sf -X POST "${GO_URL}/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')
ok "Token obtained"
echo ""

# --- Create devices ----------------------------------------------------------
info "📱 Creating devices..."

declare -A DEVICE_IDS
DEVICE_NAMES=(
  "Dell PowerEdge R740:server"
  "HP ProLiant DL380:server"
  "Cisco Catalyst 9300:network"
  "MacBook Pro 16:laptop"
  "ThinkPad X1 Carbon:laptop"
  "iPad Pro 12.9:tablet"
  "Samsung Galaxy S24:phone"
  "Ubiquiti UniFi AP:network"
  "Synology DS920+:storage"
  "Raspberry Pi 5:iot"
)

create_device() {
  local name="$1"
  local type="$2"
  echo -n "  ${name} (${type})... "

  local json
  json=$(python3 -c "
import sys, json
print(json.dumps({'name': '${name}', 'type': '${type}'}))
")

  local response
  response=$(curl -sf -X POST "${GO_URL}/devices" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "$json") || {
    fail "FAILED"
    echo ""
    return 1
  }

  local id
  id=$(echo "$response" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
  DEVICE_IDS["$name"]="$id"
  ok "${id}"
  CREATED_DEVICES=$((CREATED_DEVICES + 1))
}

for entry in "${DEVICE_NAMES[@]}"; do
  IFS=':' read -r name dtype <<< "$entry"
  create_device "$name" "$dtype" || true
done
echo ""

# --- Create events -----------------------------------------------------------
info "📋 Adding events..."

# Event descriptions grouped by device type and event type.
# Each array entry is one event description. We iterate through them to get
# roughly 16 events per device (varies slightly by device type for realism).

declare -A EVENTS_BY_TYPE

# --- server ---
EVENTS_BY_TYPE["server_maintenance_0"]='Thermal paste replaced and fans cleaned'
EVENTS_BY_TYPE["server_maintenance_1"]='RAM upgraded from 64GB to 128GB'
EVENTS_BY_TYPE["server_maintenance_2"]='OS patching and reboot completed'
EVENTS_BY_TYPE["server_firmware-update_0"]='BIOS updated to v2.8.1'
EVENTS_BY_TYPE["server_firmware-update_1"]='iDRAC firmware updated to v7.10'
EVENTS_BY_TYPE["server_inspection_0"]='Quarterly hardware inspection — all components OK'
EVENTS_BY_TYPE["server_inspection_1"]='Cable management and airflow check completed'
EVENTS_BY_TYPE["server_alert_0"]='Disk usage on /dev/sda1 exceeded 85%'
EVENTS_BY_TYPE["server_alert_1"]='Temperature sensor warning in chassis'
EVENTS_BY_TYPE["server_audit_0"]='Security audit completed — no vulnerabilities found'
EVENTS_BY_TYPE["server_audit_1"]='Compliance audit — passed all controls'
EVENTS_BY_TYPE["server_repair_0"]='Replaced faulty PSU in bay 2'
EVENTS_BY_TYPE["server_repair_1"]='Replaced failed SSD in RAID array'
EVENTS_BY_TYPE["server_relocation_0"]='Moved from rack A3 to rack B7'
EVENTS_BY_TYPE["server_alert_2"]='Memory ECC error detected and corrected'
EVENTS_BY_TYPE["server_inspection_2"]='Power supply and cooling system inspection passed'

EVENTS_BY_TYPE["network_maintenance_2"]='Cable management and labeling update'
EVENTS_BY_TYPE["network_alert_2"]='Interface flapping detected on port Gi1/0/3'

EVENTS_BY_TYPE["laptop_maintenance_2"]='System thermal paste reapplied'
EVENTS_BY_TYPE["laptop_alert_2"]='Unusual login attempt detected from new location'

EVENTS_BY_TYPE["tablet_maintenance_2"]='Charging port cleaning and inspection'
EVENTS_BY_TYPE["tablet_alert_2"]='Application crash rate threshold exceeded'

EVENTS_BY_TYPE["phone_maintenance_2"]='Charging port lint cleaning performed'
EVENTS_BY_TYPE["phone_alert_2"]='Suspicious network connection blocked'

EVENTS_BY_TYPE["storage_inspection_2"]='Cooling system and filter inspection'
EVENTS_BY_TYPE["storage_alert_2"]='Drive temperature exceeded safe threshold'

EVENTS_BY_TYPE["iot_maintenance_2"]='System clock sync performed'
EVENTS_BY_TYPE["iot_alert_2"]='SD card write speed degradation detected'

# --- network ---
EVENTS_BY_TYPE["network_maintenance_0"]='Switch firmware cleanup and reboot completed'
EVENTS_BY_TYPE["network_maintenance_1"]='VLAN configuration audit and cleanup'
EVENTS_BY_TYPE["network_firmware-update_0"]='Firmware updated to v17.12'
EVENTS_BY_TYPE["network_firmware-update_1"]='IOS updated to latest stable release'
EVENTS_BY_TYPE["network_inspection_0"]='Weekly network device health check passed'
EVENTS_BY_TYPE["network_inspection_1"]='Port utilization review completed — all nominal'
EVENTS_BY_TYPE["network_alert_0"]='High bandwidth usage detected on uplink port'
EVENTS_BY_TYPE["network_alert_1"]='Spanning tree topology change detected'
EVENTS_BY_TYPE["network_audit_0"]='Network security audit — all ACLs verified'
EVENTS_BY_TYPE["network_audit_1"]='SNMP community strings rotated successfully'
EVENTS_BY_TYPE["network_repair_0"]='Replaced failed SFP+ transceiver'
EVENTS_BY_TYPE["network_repair_1"]='Replaced faulty cooling fan module'
EVENTS_BY_TYPE["network_relocation_0"]='Moved to new IDF location'
EVENTS_BY_TYPE["network_relocation_1"]='Repositioned for better cable management'

# --- laptop ---
EVENTS_BY_TYPE["laptop_maintenance_0"]='Keyboard cleaning and keycap inspection'
EVENTS_BY_TYPE["laptop_maintenance_1"]='Battery calibration performed'
EVENTS_BY_TYPE["laptop_firmware-update_0"]='BIOS/UEFI updated to v1.25'
EVENTS_BY_TYPE["laptop_firmware-update_1"]='Thunderbolt controller firmware updated'
EVENTS_BY_TYPE["laptop_inspection_0"]='Bi-annual hardware inspection passed'
EVENTS_BY_TYPE["laptop_inspection_1"]='Display panel inspection — no dead pixels'
EVENTS_BY_TYPE["laptop_alert_0"]='Battery health degraded below 80%'
EVENTS_BY_TYPE["laptop_alert_1"]='S.M.A.R.T. warning on primary storage drive'
EVENTS_BY_TYPE["laptop_audit_0"]='Endpoint security audit completed'
EVENTS_BY_TYPE["laptop_audit_1"]='Full disk encryption verified'
EVENTS_BY_TYPE["laptop_repair_0"]='Replaced failing SSD'
EVENTS_BY_TYPE["laptop_repair_1"]='Replaced defective USB-C port'
EVENTS_BY_TYPE["laptop_relocation_0"]='Reassigned to new team member'
EVENTS_BY_TYPE["laptop_relocation_1"]='Moved to department on floor 4'

# --- tablet ---
EVENTS_BY_TYPE["tablet_maintenance_0"]='Screen protector replaced'
EVENTS_BY_TYPE["tablet_maintenance_1"]='Cache and temporary files cleared'
EVENTS_BY_TYPE["tablet_firmware-update_0"]='OS updated to latest version'
EVENTS_BY_TYPE["tablet_firmware-update_1"]='MDM profile updated'
EVENTS_BY_TYPE["tablet_inspection_0"]='Touch screen calibration verified'
EVENTS_BY_TYPE["tablet_inspection_1"]='Camera and sensor check completed'
EVENTS_BY_TYPE["tablet_alert_0"]='Battery health degraded below 75%'
EVENTS_BY_TYPE["tablet_alert_1"]='Storage space critically low (below 10%)'
EVENTS_BY_TYPE["tablet_audit_0"]='Device compliance policy verified'
EVENTS_BY_TYPE["tablet_audit_1"]='Application whitelist audit completed'
EVENTS_BY_TYPE["tablet_repair_0"]='Replaced cracked digitizer'
EVENTS_BY_TYPE["tablet_repair_1"]='Replaced worn battery'
EVENTS_BY_TYPE["tablet_relocation_0"]='Reassigned to field sales team'
EVENTS_BY_TYPE["tablet_relocation_1"]='Moved to executive floor'

# --- phone ---
EVENTS_BY_TYPE["phone_maintenance_0"]='App permission review and cleanup'
EVENTS_BY_TYPE["phone_maintenance_1"]='Battery optimization cycle completed'
EVENTS_BY_TYPE["phone_firmware-update_0"]='Android security patch updated to June 2026'
EVENTS_BY_TYPE["phone_firmware-update_1"]='Carrier settings updated'
EVENTS_BY_TYPE["phone_inspection_0"]='Device condition assessment completed'
EVENTS_BY_TYPE["phone_inspection_1"]='Screen and enclosure damage inspection'
EVENTS_BY_TYPE["phone_alert_0"]='Battery health degraded below 80% threshold'
EVENTS_BY_TYPE["phone_alert_1"]='Unusual app permissions detected'
EVENTS_BY_TYPE["phone_audit_0"]='MDM compliance audit completed'
EVENTS_BY_TYPE["phone_audit_1"]='Data encryption status verified'
EVENTS_BY_TYPE["phone_repair_0"]='Replaced cracked screen'
EVENTS_BY_TYPE["phone_repair_1"]='Replaced degraded battery'
EVENTS_BY_TYPE["phone_relocation_0"]='Reassigned to new employee'
EVENTS_BY_TYPE["phone_relocation_1"]='Moved to executive team'

# --- storage ---
EVENTS_BY_TYPE["storage_maintenance_0"]='Disk health check and S.M.A.R.T. analysis'
EVENTS_BY_TYPE["storage_maintenance_1"]='RAID array consistency check completed'
EVENTS_BY_TYPE["storage_firmware-update_0"]='DSM updated to v7.5'
EVENTS_BY_TYPE["storage_firmware-update_1"]='RAID controller firmware updated'
EVENTS_BY_TYPE["storage_inspection_0"]='Quarterly storage capacity review'
EVENTS_BY_TYPE["storage_inspection_1"]='Drive bay physical inspection completed'
EVENTS_BY_TYPE["storage_alert_0"]='Storage pool capacity exceeded 85%'
EVENTS_BY_TYPE["storage_alert_1"]='RAID array degraded — one drive failed'
EVENTS_BY_TYPE["storage_audit_0"]='Data integrity audit — checksums verified'
EVENTS_BY_TYPE["storage_audit_1"]='Backup verification — all snapshots valid'
EVENTS_BY_TYPE["storage_repair_0"]='Replaced failed HDD in RAID 6 array'
EVENTS_BY_TYPE["storage_repair_1"]='Replaced faulty power supply unit'
EVENTS_BY_TYPE["storage_relocation_0"]='Moved to primary data center rack'
EVENTS_BY_TYPE["storage_relocation_1"]='Relocated to backup site'

# --- iot ---
EVENTS_BY_TYPE["iot_maintenance_0"]='Sensor calibration verified and adjusted'
EVENTS_BY_TYPE["iot_maintenance_1"]='Log rotation and cleanup performed'
EVENTS_BY_TYPE["iot_firmware-update_0"]='Raspberry Pi OS updated to latest'
EVENTS_BY_TYPE["iot_firmware-update_1"]='Python runtime updated to v3.13'
EVENTS_BY_TYPE["iot_inspection_0"]='Physical inspection — enclosure sealed properly'
EVENTS_BY_TYPE["iot_inspection_1"]='Antenna and signal strength verified'
EVENTS_BY_TYPE["iot_alert_0"]='Device offline for more than 30 minutes'
EVENTS_BY_TYPE["iot_alert_1"]='CPU temperature exceeded 80°C'
EVENTS_BY_TYPE["iot_audit_0"]='IoT security posture review completed'
EVENTS_BY_TYPE["iot_audit_1"]='Network access control verified'
EVENTS_BY_TYPE["iot_repair_0"]='Replaced corrupted SD card'
EVENTS_BY_TYPE["iot_repair_1"]='Replaced faulty power adapter'
EVENTS_BY_TYPE["iot_relocation_0"]='Moved to sensor array location B'
EVENTS_BY_TYPE["iot_relocation_1"]='Reassigned to monitoring station 3'

# Determine actor based on event type
actor_for_event_type() {
  case "$1" in
    maintenance|repair|inspection)  echo "technician" ;;
    firmware-update|audit|relocation) echo "admin" ;;
    alert) echo "system" ;;
    *) echo "admin" ;;
  esac
}

create_event() {
  local device_id="$1"
  local device_name="$2"
  local event_type="$3"
  local actor="$4"
  local description="$5"

  local json
  json=$(python3 -c "
import sys, json
event = {
    'type': '$event_type',
    'deviceId': '$device_id',
    'name': '$device_name',
    'actor': '$actor',
    'description': '$description'
}
print(json.dumps(event))
")

  # Use -X POST and skip -sf so we get error output on failure
  local response
  response=$(curl -s -X POST "${NODE_URL}/events" \
    -H 'Content-Type: application/json' \
    -d "$json") 2>/dev/null || return 1

  # Check if response looks like a success (has an "id" field)
  if echo "$response" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert "id" in d' 2>/dev/null; then
    CREATED_EVENTS=$((CREATED_EVENTS + 1))
    return 0
  fi
  return 1
}

for device_name in "${!DEVICE_IDS[@]}"; do
  device_id="${DEVICE_IDS[$device_name]}"
  echo "  ${device_name}..."

  # Determine device type from the name
  local_device_type=""
  for entry in "${DEVICE_NAMES[@]}"; do
    IFS=':' read -r ename etype <<< "$entry"
    if [ "$ename" = "$device_name" ]; then
      local_device_type="$etype"
      break
    fi
  done

  if [ -z "$local_device_type" ]; then
    warn "Unknown type for ${device_name}, skipping events"
    continue
  fi

  # Iterate through event types and descriptions
  for event_type in maintenance firmware-update inspection alert audit repair relocation; do
    for idx in 0 1 2; do
      key="${local_device_type}_${event_type}_${idx}"
      desc="${EVENTS_BY_TYPE[$key]:-}"

      if [ -z "$desc" ]; then
        continue
      fi

      actor=$(actor_for_event_type "$event_type")

      if create_event "$device_id" "$device_name" "$event_type" "$actor" "$desc"; then
        : # success, already counted
      else
        warn "Failed to create event for ${device_name}: ${desc}"
      fi
    done
  done

  ok "Events added (${CREATED_EVENTS} total so far)"
done
echo ""

# --- Delete sample devices ---------------------------------------------------
info "🗑️  Deleting sample devices..."

# Find and delete devices that should be in the "Deleted Devices" section
delete_named_device() {
  local target_name="$1"
  echo -n "  Deleting ${target_name}... "

  # Get the device list and find the ID
  local list
  list=$(curl -sf "${GO_URL}/devices" -H "Authorization: Bearer ${TOKEN}") || {
    warn "Could not list devices"
    return 1
  }

  local device_id
  device_id=$(echo "$list" | python3 -c "
import sys, json
devices = json.load(sys.stdin)
for d in devices:
    if d['name'] == '$target_name':
        print(d['id'])
        break
") || true

  if [ -z "$device_id" ]; then
    warn "Not found (already deleted?)"
    return 1
  fi

  if curl -sf -X DELETE "${GO_URL}/devices/${device_id}" \
    -H "Authorization: Bearer ${TOKEN}" &>/dev/null; then
    ok "Deleted"
    DELETED_DEVICES=$((DELETED_DEVICES + 1))
  else
    fail "Failed to delete"
  fi
}

delete_named_device "Cisco Catalyst 9300" || true
delete_named_device "iPad Pro 12.9" || true
delete_named_device "Raspberry Pi 5" || true
echo ""

# --- Summary ----------------------------------------------------------------
info "======================================"
info "  Done!"
info "======================================"
echo ""
echo -e "  ${GREEN}✅ ${CREATED_DEVICES} devices created${NC}"
echo -e "  ${GREEN}✅ ${CREATED_EVENTS} events logged${NC}"
echo -e "  ${YELLOW}🗑️  ${DELETED_DEVICES} devices deleted${NC}"
echo ""
echo "  Verification commands (run after seed):"
echo "    curl -s ${GO_URL}/devices -H \"Authorization: Bearer \$(curl -sf -X POST ${GO_URL}/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin\"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)[\"token\"])')\" | python3 -m json.tool | head -30"
echo "    curl -s '${NODE_URL}/events?type=device.deleted' | python3 -m json.tool"
echo "    curl -s '${NODE_URL}/events?deviceId=DEVICE_ID' | python3 -m json.tool | head -30"
echo ""
