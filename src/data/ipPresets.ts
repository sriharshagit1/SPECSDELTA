import { ArtifactFile, GroundTruthItem } from './demoData';
import { SpecChange, ArtifactMapping, VerificationGap, StaleReport } from '../types/specDelta';
import {
  DEMO_SPEC_V1 as UART_SPEC_V1,
  DEMO_SPEC_V2 as UART_SPEC_V2,
  DEMO_ARTIFACTS as UART_ARTIFACTS,
  DEMO_GROUND_TRUTH as UART_GROUND_TRUTH,
} from './demoData';
import {
  DEMO_PRECOMPUTED_CHANGES as UART_CHANGES,
  DEMO_PRECOMPUTED_MAPPINGS as UART_MAPPINGS,
  DEMO_PRECOMPUTED_GAPS as UART_GAPS,
} from './demoResults';

export interface IPPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  revisions: string;
  specV1: string;
  specV2: string;
  artifacts: ArtifactFile[];
  groundTruth: GroundTruthItem[];
  precomputedChanges: SpecChange[];
  precomputedMappings: ArtifactMapping[];
  precomputedGaps: VerificationGap[];
}

// --------------------------------------------------------------------------
// PRESET 2: PCIe Gen4 to Gen5 Controller IP (PCIE_GEN5_CTRL_IP)
// --------------------------------------------------------------------------
const PCIE_SPEC_V1 = `# HARDWARE SPECIFICATION: PCI Express Gen4 Controller Subsystem (PCIE_GEN5_CTRL_IP)
Revision: 4.1.0
Status: Released

## 1. Subsystem Architecture
The PCIe controller implements a high-throughput endpoint and root port for high-bandwidth system interconnect conforming to PCI-SIG Base Specification 4.0.

## 2. Physical & Datapath Interface
### 2.1 Internal Datapath
- Internal datapath bus width: 256-bit pipelined parallel interface clocked at 500MHz to achieve 16 GT/s throughput across 16 lanes.
- Signal declaration: logic [255:0] tx_data_bus, rx_data_bus.

### 2.2 Sideband & Reset Signals
- perst_n: Fundamental reset input pin. Active-low: 0 indicates fundamental cold reset.
- link_up: Active-high status flag indicating L0 state.

## 3. Configuration & Capabilities Space
### 3.1 Device Control & Capabilities (Offset: 0x60)
- Bits [7:5]: MAX_PAYLOAD_SIZE (MPS). Encoded maximum payload size:
  - 3'b000 = 128 Bytes
  - 3'b001 = 256 Bytes (Default reset value: 3'b001)
  - 3'b010 = 512 Bytes
- Bit [8]: EXT_TAG_EN. 1 = Extended Tag Field enabled. Default: 0.

### 3.2 Advanced Error Reporting (Offset: 0x104)
- Register: AER_UNCORR_ERR_STATUS. Uncorrectable Error Status Register at offset 0x104.
- Bit [4]: Data Link Protocol Error.
- Bit [12]: Poisoned TLP Received.
- Bit [14]: Completion Timeout.

### 3.3 Interrupt Mechanisms
- Supports legacy INTx wire-OR interrupt emulation (INTA, INTB, INTC, INTD) as well as MSI and MSI-X.

## 4. Link Training and Status State Machine (LTSSM)
### 4.1 Speed Negotiation
- Operates at Gen1 (2.5 GT/s), Gen2 (5.0 GT/s), Gen3 (8.0 GT/s), and Gen4 (16.0 GT/s).
- Maximum link rate configuration: 4'b0100 (Gen4).

### 4.2 Recovery State Timeout
- LTSSM Recovery.Idle and Recovery.Equalization timeout budget is strictly limited to 24 microseconds (RECOVERY_TIMEOUT_US = 24).
`;

const PCIE_SPEC_V2 = `# HARDWARE SPECIFICATION: PCI Express Gen5 Controller Subsystem (PCIE_GEN5_CTRL_IP)
Revision: 5.0.0
Status: Approved for Tape-Out

## 1. Subsystem Architecture
The PCIe controller is upgraded to support PCI Express 5.0 (32 GT/s per lane) with backwards compatibility down to Gen1.

## 2. Physical & Datapath Interface
### 2.1 Internal Datapath
- Internal datapath bus width is doubled from 256-bit to 512-bit clocked at 1GHz to sustain 32 GT/s Gen5 rates (DATA_BUS_WIDTH = 512).
- Signal declaration: logic [511:0] tx_data_bus, rx_data_bus.

### 2.2 Sideband & Reset Signals
- perst_active_high: Fundamental reset polarity is inverted to active-high per corporate ASIC pad cell standardization (0 = normal operation, 1 = reset).
- link_up: Active-high status flag indicating L0 state.

## 3. Configuration & Capabilities Space
### 3.1 Device Control & Capabilities (Offset: 0x60)
- Bits [7:5]: MAX_PAYLOAD_SIZE (MPS). Default power-on reset value changed to 3'b010 (512 Bytes default) to reduce TLP header overhead on high-speed fabrics.
- Bit [8]: EXT_TAG_EN. 1 = Extended Tag Field enabled. Default: 1.

### 3.2 Advanced Error Reporting (Offset: 0x104)
- Register: Renamed from AER_UNCORR_ERR_STATUS to AER_UNCORR_STATUS_REG to align with unified PCIe register nomenclature across drivers.
- Bit [4]: Data Link Protocol Error.
- Bit [12]: Poisoned TLP Received.
- Bit [14]: Completion Timeout.
- Bit [20]: UNEXPECTED_CPL_ABORT_IRQ. (New interrupt source for Gen5 multi-packet completion abort).

### 3.3 Interrupt Mechanisms
- Legacy INTx wire-OR emulation has been completely removed from hardware. All interrupts must use Message Signaled Interrupts (MSI or MSI-X).

## 4. Link Training and Status State Machine (LTSSM)
### 4.1 Speed Negotiation & Equalization
- Upgraded to support Gen5 (32.0 GT/s) using 128b/130b encoding with modified transmitter preset equalization.
- Added programmable Equalization Phase 3 Bypass mode configured in EQ_CTRL_REG[2].

### 4.2 Recovery State Timeout
- LTSSM Recovery timeout budget is relaxed from 24 microseconds to 48 microseconds (RECOVERY_TIMEOUT_US = 48) to allow multi-vendor PHY analog coefficient tuning without dropping link.
`;

const PCIE_ARTIFACTS: ArtifactFile[] = [
  {
    id: 'pcie-art-1',
    name: 'rtl/pcie_controller_top.sv',
    type: 'RTL',
    language: 'systemverilog',
    content: `// ==============================================================================
// Module: pcie_controller_top
// Description: PCIe Gen4/Gen5 Controller Top-Level
// ==============================================================================
module pcie_controller_top (
  input  logic        clk_core,
  input  logic        perst_n,          // Stale: Spec v2 uses perst_active_high!
  
  // Datapath Interface
  input  logic [255:0] s_axis_tx_tdata, // Stale: Spec v2 widened datapath to 512 bits!
  input  logic         s_axis_tx_tvalid,
  output logic         s_axis_tx_tready,
  
  output logic [31:0] aer_uncorr_err_status, // Stale register name
  output logic        intx_msi_legacy_irq    // Stale: INTx removed in v2
);

  logic [255:0] tx_pipe_reg;
  logic [2:0]   mps_cfg;

  always_ff @(posedge clk_core or negedge perst_n) begin
    if (!perst_n) begin
      mps_cfg     <= 3'b001; // Stale: Spec v2 default MPS reset is 3'b010 (512B)
      tx_pipe_reg <= '0;
    end else begin
      if (s_axis_tx_tvalid && s_axis_tx_tready) begin
        tx_pipe_reg <= s_axis_tx_tdata;
      end
    end
  end

  // Notice: No decoder for 32 GT/s Gen5 rates
  // Notice: Missing bit 20 UNEXPECTED_CPL_ABORT_IRQ routing
endmodule
`,
  },
  {
    id: 'pcie-art-2',
    name: 'regs/pcie_regs.h',
    type: 'Registers',
    language: 'c',
    content: `/*
 * PCIe Controller Register Header
 */
#ifndef PCIE_REGS_H
#define PCIE_REGS_H

#define PCIE_DEV_CTRL_OFFSET            0x60
#define PCIE_DEV_CTRL_MPS_RESET_VAL     0x1     // Stale: v2 changed to 0x2 (512B)
#define PCIE_DEV_CTRL_MPS_MASK          (0x7 << 5)

// Stale Register Name
#define AER_UNCORR_ERR_STATUS_REG       0x104   // Renamed in v2 to AER_UNCORR_STATUS_REG
#define AER_UNCORR_DATA_LINK_ERR        (1U << 4)
#define AER_UNCORR_POISON_TLP           (1U << 12)
// Missing #define AER_UNCORR_UNEXP_CPL_ABORT (1U << 20)

#define PCIE_DATAPATH_WIDTH_BITS        256     // Stale: Widened to 512 bits in Gen5

#endif
`,
  },
  {
    id: 'pcie-art-3',
    name: 'sva/pcie_assertions.sv',
    type: 'Assertions',
    language: 'systemverilog',
    content: `// SystemVerilog Assertions for PCIe LTSSM & Protocol
module pcie_assertions (
  input logic clk,
  input logic rst_n,
  input logic [3:0] ltssm_state,
  input logic [15:0] recovery_timer
);

  // Recovery Timeout SVA: Strictly flags error if timer exceeds 24us (2400 clks)
  // Stale: Spec v2 relaxed recovery timeout to 48us!
  property p_recovery_timeout_check;
    @(posedge clk) disable iff (!rst_n)
    (ltssm_state == 4'h6) |-> (recovery_timer <= 16'd2400);
  endproperty
  assert_recovery_timeout: assert property (p_recovery_timeout_check)
    else $error("LTSSM Recovery Timeout Exceeded 24us");

  // Reset SVA: Assumes perst is active low
  property p_reset_active_low;
    @(posedge clk) (!rst_n) |-> (ltssm_state == 4'h0);
  endproperty

  // GAP: No SVA assertion for Gen5 EQ Phase 3 Bypass!
endmodule
`,
  },
  {
    id: 'pcie-art-4',
    name: 'tb/pcie_tb_env.sv',
    type: 'UVM/TB',
    language: 'systemverilog',
    content: `// UVM Environment for PCIe Verification
class pcie_tb_env extends uvm_env;
  \`uvm_component_utils(pcie_tb_env)

  virtual task run_phase(uvm_phase phase);
    // Legacy INTx interrupt test sequence (Stale: INTx removed in v2!)
    test_legacy_intx_routing();
  endtask

  task test_legacy_intx_routing();
    \`uvm_info("PCIE_TB", "Exercising Legacy INTx Emulation lines INTA/INTB", UVM_LOW)
  endtask
endclass
`,
  },
  {
    id: 'pcie-art-5',
    name: 'cov/pcie_coverage.sv',
    type: 'Coverage',
    language: 'systemverilog',
    content: `module pcie_coverage (
  input logic clk,
  input logic [3:0] link_speed
);
  covergroup cg_pcie_speeds @(posedge clk);
    cp_speed: coverpoint link_speed {
      bins gen1 = {4'd1};
      bins gen2 = {4'd2};
      bins gen3 = {4'd3};
      bins gen4 = {4'd4};
      // GAP: Missing bin for Gen5 (32 GT/s: 4'd5)!
    }
  endgroup

  // GAP: Missing covergroup for Equalization Phase 3 Bypass!
endmodule
`,
  },
  {
    id: 'pcie-art-6',
    name: 'docs/pcie_testplan.md',
    type: 'Testplan',
    language: 'markdown',
    content: `# PCIe Subsystem Verification Test Plan

| Test ID | Description | Feature | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC_PCIE_WIDTH_01** | Verify 256-bit AXI datapath streaming | Datapath | 256-bit transactions transferred without backpressure |
| **TC_PCIE_RECOVERY** | Verify Recovery state finishes within <= 24us | LTSSM | State transition <= 24us |
| **TC_PCIE_INTX_01** | Stimulate Legacy INTx interrupt lines | Interrupts | Driver receives INTA assertion |
| **TC_PCIE_RESET_01** | Verify perst_n active-low cold reset | Reset | System resets when perst_n is pulled low |

### Verification Gaps in Gen5:
- Missing test for 32 GT/s speed negotiation.
- Missing test for Equalization Phase 3 Bypass mode.
- Missing test for UNEXPECTED_CPL_ABORT_IRQ.
`,
  },
];

const PCIE_GROUND_TRUTH: GroundTruthItem[] = [
  {
    id: 'PCIE-GT-1',
    title: 'Internal Datapath Widened (256-bit to 512-bit)',
    change_type: 'width',
    clause: 'Section 2.1',
    description: 'Internal datapath bus width doubled from 256-bit to 512-bit',
    keywords: ['datapath', 'width', '512', '256', 'bus'],
    expected_stale_files: ['rtl/pcie_controller_top.sv', 'regs/pcie_regs.h', 'docs/pcie_testplan.md'],
  },
  {
    id: 'PCIE-GT-2',
    title: 'PERST Reset Polarity Changed (Active-Low to Active-High)',
    change_type: 'polarity',
    clause: 'Section 2.2',
    description: 'perst_n active-low changed to perst_active_high',
    keywords: ['perst', 'polarity', 'reset', 'active-high'],
    expected_stale_files: ['rtl/pcie_controller_top.sv', 'sva/pcie_assertions.sv', 'docs/pcie_testplan.md'],
  },
  {
    id: 'PCIE-GT-3',
    title: 'Default MPS Reset Value Changed (256B to 512B)',
    change_type: 'reset_value',
    clause: 'Section 3.1',
    description: 'Max Payload Size default reset changed from 3\'b001 (256B) to 3\'b010 (512B)',
    keywords: ['mps', 'payload', 'reset', '3\'b010', '512'],
    expected_stale_files: ['rtl/pcie_controller_top.sv', 'regs/pcie_regs.h'],
  },
  {
    id: 'PCIE-GT-4',
    title: 'AER Register Renamed to AER_UNCORR_STATUS_REG',
    change_type: 'rename',
    clause: 'Section 3.2',
    description: 'AER_UNCORR_ERR_STATUS renamed to AER_UNCORR_STATUS_REG',
    keywords: ['rename', 'aer', 'uncorr', 'status', '0x104'],
    expected_stale_files: ['rtl/pcie_controller_top.sv', 'regs/pcie_regs.h'],
  },
  {
    id: 'PCIE-GT-5',
    title: 'Legacy INTx Emulation Removed',
    change_type: 'removed',
    clause: 'Section 3.3',
    description: 'Legacy INTx wire-OR interrupts removed from hardware (MSI/MSI-X only)',
    keywords: ['intx', 'removed', 'legacy', 'msi'],
    expected_stale_files: ['rtl/pcie_controller_top.sv', 'tb/pcie_tb_env.sv', 'docs/pcie_testplan.md'],
  },
  {
    id: 'PCIE-GT-6',
    title: 'Gen5 32 GT/s Link Speed Support Added',
    change_type: 'new_feature',
    clause: 'Section 4.1',
    description: 'Upgraded PHY speed negotiation to support Gen5 32 GT/s with 128b/130b',
    keywords: ['gen5', 'speed', '32 gt/s', '128b/130b', 'rate'],
    expected_stale_files: ['rtl/pcie_controller_top.sv'],
    expected_gaps: ['Assertions', 'Coverage', 'Testplan'],
  },
  {
    id: 'PCIE-GT-7',
    title: 'LTSSM Recovery Timeout Relaxed (24us to 48us)',
    change_type: 'timing',
    clause: 'Section 4.2',
    description: 'Recovery timeout relaxed from 24 microseconds to 48 microseconds',
    keywords: ['recovery', 'timeout', 'timing', '48', 'latency'],
    expected_stale_files: ['sva/pcie_assertions.sv', 'docs/pcie_testplan.md'],
  },
  {
    id: 'PCIE-GT-8',
    title: 'New Interrupt UNEXPECTED_CPL_ABORT_IRQ Added',
    change_type: 'new_feature',
    clause: 'Section 3.2',
    description: 'Added bit 20 UNEXPECTED_CPL_ABORT_IRQ in AER status register',
    keywords: ['unexpected_cpl', 'interrupt', 'bit 20', 'abort'],
    expected_stale_files: ['regs/pcie_regs.h', 'rtl/pcie_controller_top.sv'],
    expected_gaps: ['Coverage', 'Testplan'],
  },
];

const PCIE_PRECOMPUTED_CHANGES: SpecChange[] = [
  {
    id: 'CHG-1',
    change_type: 'width',
    spec_clause: 'Section 2.1',
    old_value: '256-bit parallel datapath (tx_data_bus [255:0])',
    new_value: '512-bit parallel datapath (tx_data_bus [511:0])',
    summary: 'Internal datapath bus width doubled from 256 bits to 512 bits for Gen5 bandwidth',
    severity: 'critical',
  },
  {
    id: 'CHG-2',
    change_type: 'polarity',
    spec_clause: 'Section 2.2',
    old_value: 'perst_n active-low fundamental reset',
    new_value: 'perst_active_high active-high fundamental reset',
    summary: 'Fundamental reset pin polarity inverted from active-low to active-high',
    severity: 'critical',
  },
  {
    id: 'CHG-3',
    change_type: 'reset_value',
    spec_clause: 'Section 3.1',
    old_value: 'Default MPS power-on reset: 3\'b001 (256 Bytes)',
    new_value: 'Default MPS power-on reset: 3\'b010 (512 Bytes)',
    summary: 'Changed Maximum Payload Size default power-on reset value to 512 Bytes',
    severity: 'major',
  },
  {
    id: 'CHG-4',
    change_type: 'rename',
    spec_clause: 'Section 3.2',
    old_value: 'AER_UNCORR_ERR_STATUS (offset 0x104)',
    new_value: 'AER_UNCORR_STATUS_REG (offset 0x104)',
    summary: 'Renamed uncorrectable error status register to AER_UNCORR_STATUS_REG',
    severity: 'minor',
  },
  {
    id: 'CHG-5',
    change_type: 'removed',
    spec_clause: 'Section 3.3',
    old_value: 'Legacy INTx wire-OR interrupt emulation supported',
    new_value: 'Legacy INTx emulation completely removed (MSI/MSI-X only)',
    summary: 'Deprecated and removed legacy INTx interrupt lines from controller hardware',
    severity: 'major',
  },
  {
    id: 'CHG-6',
    change_type: 'new_feature',
    spec_clause: 'Section 4.1',
    old_value: 'Up to Gen4 16 GT/s link rates',
    new_value: 'Gen5 32 GT/s rate support added with Equalization Phase 3 bypass mode',
    summary: 'Added PCIe Gen5 32 GT/s protocol speed support and EQ Phase 3 bypass',
    severity: 'critical',
  },
  {
    id: 'CHG-7',
    change_type: 'timing',
    spec_clause: 'Section 4.2',
    old_value: 'Recovery timeout budget <= 24 microseconds',
    new_value: 'Recovery timeout budget relaxed to <= 48 microseconds',
    summary: 'Relaxed LTSSM Recovery state timeout from 24us to 48us for PHY analog tuning',
    severity: 'major',
  },
  {
    id: 'CHG-8',
    change_type: 'new_feature',
    spec_clause: 'Section 3.2',
    old_value: 'Bit 20 Reserved in AER register',
    new_value: 'Bit 20 UNEXPECTED_CPL_ABORT_IRQ interrupt added',
    summary: 'Added new interrupt source for unexpected completion packet aborts',
    severity: 'major',
  },
];

const PCIE_PRECOMPUTED_MAPPINGS: ArtifactMapping[] = [
  {
    change_id: 'CHG-1',
    file: 'rtl/pcie_controller_top.sv',
    line_range: '11-12',
    artifact_type: 'RTL',
    evidence_snippet: 'input  logic [255:0] s_axis_tx_tdata, // Stale: Spec v2 widened datapath to 512 bits!',
    why_stale: 'Port width and internal pipeline registers only accommodate 256 bits instead of required 512 bits.',
    confidence: 0.99,
    suggested_fix: 'input  logic [511:0] s_axis_tx_tdata,\nlogic [511:0] tx_pipe_reg;',
  },
  {
    change_id: 'CHG-1',
    file: 'regs/pcie_regs.h',
    line_range: '17-18',
    artifact_type: 'Registers',
    evidence_snippet: '#define PCIE_DATAPATH_WIDTH_BITS        256     // Stale: Widened to 512 bits in Gen5',
    why_stale: 'Header defines 256-bit datapath width, misconfiguring DMA buffer alignment in firmware.',
    confidence: 0.98,
    suggested_fix: '#define PCIE_DATAPATH_WIDTH_BITS        512',
  },
  {
    change_id: 'CHG-2',
    file: 'rtl/pcie_controller_top.sv',
    line_range: '8-9',
    artifact_type: 'RTL',
    evidence_snippet: 'input  logic        perst_n,          // Stale: Spec v2 uses perst_active_high!',
    why_stale: 'Reset input port and sensitivity lists use active-low logic perst_n instead of active-high.',
    confidence: 0.97,
    suggested_fix: 'input  logic perst_active_high,\n...\nalways_ff @(posedge clk_core or posedge perst_active_high)',
  },
  {
    change_id: 'CHG-3',
    file: 'rtl/pcie_controller_top.sv',
    line_range: '23-24',
    artifact_type: 'RTL',
    evidence_snippet: 'mps_cfg     <= 3\'b001; // Stale: Spec v2 default MPS reset is 3\'b010 (512B)',
    why_stale: 'Register initializes to 256B instead of the updated 512B default power-on reset state.',
    confidence: 0.96,
    suggested_fix: 'mps_cfg <= 3\'b010; // 512B default reset per Spec v2',
  },
  {
    change_id: 'CHG-4',
    file: 'regs/pcie_regs.h',
    line_range: '11-12',
    artifact_type: 'Registers',
    evidence_snippet: '#define AER_UNCORR_ERR_STATUS_REG       0x104   // Renamed in v2 to AER_UNCORR_STATUS_REG',
    why_stale: 'Driver register macro contains obsolete naming AER_UNCORR_ERR_STATUS_REG.',
    confidence: 0.99,
    suggested_fix: '#define AER_UNCORR_STATUS_REG           0x104\n#define AER_UNCORR_ERR_STATUS_REG       AER_UNCORR_STATUS_REG // Alias',
  },
  {
    change_id: 'CHG-5',
    file: 'rtl/pcie_controller_top.sv',
    line_range: '16-17',
    artifact_type: 'RTL',
    evidence_snippet: 'output logic        intx_msi_legacy_irq    // Stale: INTx removed in v2',
    why_stale: 'Hardware still drives obsolete INTx pin which was deprecated and removed from specification.',
    confidence: 0.95,
    suggested_fix: '// Remove intx_msi_legacy_irq port; controller is MSI/MSI-X only',
  },
  {
    change_id: 'CHG-5',
    file: 'tb/pcie_tb_env.sv',
    line_range: '8-10',
    artifact_type: 'UVM/TB',
    evidence_snippet: '// Legacy INTx interrupt test sequence (Stale: INTx removed in v2!)\ntest_legacy_intx_routing();',
    why_stale: 'Testbench sequence executes legacy INTx verification, causing failure on removed hardware.',
    confidence: 0.94,
    suggested_fix: '// Deprecated test_legacy_intx_routing(); update to test_msix_vector_allocation()',
  },
  {
    change_id: 'CHG-7',
    file: 'sva/pcie_assertions.sv',
    line_range: '12-16',
    artifact_type: 'Assertions',
    evidence_snippet: 'property p_recovery_timeout_check;\n  @(posedge clk) disable iff (!rst_n)\n  (ltssm_state == 4\'h6) |-> (recovery_timer <= 16\'d2400);\nendproperty',
    why_stale: 'SVA assertion flags violations above 2400 cycles (24us). Since v2 allows 48us, false positive assertion failures will trigger.',
    confidence: 0.98,
    suggested_fix: 'property p_recovery_timeout_check;\n  @(posedge clk) disable iff (!rst_n)\n  (ltssm_state == 4\'h6) |-> (recovery_timer <= 16\'d4800); // 48us\nendproperty',
  },
  {
    change_id: 'CHG-8',
    file: 'regs/pcie_regs.h',
    line_range: '14-15',
    artifact_type: 'Registers',
    evidence_snippet: '// Missing #define AER_UNCORR_UNEXP_CPL_ABORT (1U << 20)',
    why_stale: 'Header file is missing macro for bit 20 UNEXPECTED_CPL_ABORT_IRQ in AER register.',
    confidence: 0.92,
    suggested_fix: '#define AER_UNCORR_UNEXP_CPL_ABORT (1U << 20)',
  },
];

const PCIE_PRECOMPUTED_GAPS: VerificationGap[] = [
  {
    change_id: 'CHG-6',
    change_summary: 'Added PCIe Gen5 32 GT/s protocol speed support and EQ Phase 3 bypass',
    missing_artifacts: ['Assertions', 'Coverage', 'Testplan'],
    recommendation: 'Add coverpoint bin in cg_pcie_speeds for Gen5 link rate (32 GT/s: 4\'d5). Implement SVA property p_eq_ph3_bypass_handshake to verify transmitter bypasses phase 3 equalization. Add verification testcase TC_GEN5_LINK_UP to testplan.',
  },
  {
    change_id: 'CHG-8',
    change_summary: 'Added new interrupt source for unexpected completion packet aborts (bit 20)',
    missing_artifacts: ['Coverage', 'Testplan'],
    recommendation: 'Add coverpoint bin in AER coverage for bit 20. Add testcase TC_AER_CPL_ABORT stimulating malformed completion TLPs.',
  },
];

// --------------------------------------------------------------------------
// PRESET 3: Octal SPI / QSPI Flash Memory Controller (OCTAL_SPI_IP)
// --------------------------------------------------------------------------
const SPI_SPEC_V1 = `# HARDWARE SPECIFICATION: Quad SPI NOR Flash Controller (OCTAL_SPI_IP)
Revision: 1.2.0
Status: Released

## 1. Subsystem Architecture
The SPI IP core interfaces host SoC processors with external serial NOR flash devices using Standard SPI and Quad SPI protocols.

## 2. Interface Signals & Pinout
### 2.1 Serial Bus Signals
- sck: Serial clock output.
- cs_n: Active-low chip select output. Asserted 1'b0 during bus transaction.
- io0_do: Serial data output (MOSI in standard SPI).
- io1_di: Serial data input (MISO in standard SPI).

## 3. Register Definition
### 3.1 Control Register (SPI_CTRL_REG, Offset: 0x00)
- Bit [0]: SPI_EN. Core enable. Default: 0.
- Bit [1]: CPOL. Clock polarity. 0 = SCK idles low. Default reset value: 1'b0.
- Bit [2]: CPHA. Clock phase. 0 = Data captured on first SCK edge. Default: 1'b0.
- Bit [5]: THREE_WIRE_MODE. 1 = 3-wire bidirectional single pin mode.

### 3.2 Command Register (SPI_CMD_CODE_REG, Offset: 0x08)
- Bits [7:0]: CMD_CODE. 8-bit flash instruction opcode (e.g., 0x03 Read, 0x02 Page Program).
- Bits [31:8]: Reserved.

### 3.3 FIFO Architecture
- Integrated hardware TX/RX FIFO depth is 16 bytes (FIFO_DEPTH = 16).

## 4. Operational Timing
### 4.1 Read Dummy Cycles
Fast-read operations under Quad-SPI mode require 6 dummy clock cycles at 66MHz clock frequencies (DUMMY_CYCLES = 6).
`;

const SPI_SPEC_V2 = `# HARDWARE SPECIFICATION: Octal SPI NOR Flash Controller (OCTAL_SPI_IP)
Revision: 2.0.0
Status: Approved

## 1. Subsystem Architecture
The controller is enhanced to support high-throughput Octal Double Transfer Rate (O-DTR) flash protocols across an 8-bit bidirectional data bus.

## 2. Interface Signals & Pinout
### 2.1 Serial Bus Signals
- sck: Serial clock output (up to 133MHz).
- cs_en: Chip select polarity is inverted to active-high (cs_en: 1'b1 = active transfer, 0'b0 = deselect) to interface with new high-reliability automotive flash transceivers.
- io[7:0]: 8-bit bidirectional data bus for Octal DTR transfers.

## 3. Register Definition
### 3.1 Control Register (SPI_CTRL_REG, Offset: 0x00)
- Bit [0]: SPI_EN. Core enable. Default: 0.
- Bit [1]: CPOL. Clock polarity. Inverted default reset value: 1'b1 (SCK idles high by default).
- Bit [2]: CPHA. Clock phase. Default: 1'b0.
- Bit [5]: Reserved. (Legacy THREE_WIRE_MODE removed from hardware).

### 3.2 Command Register (OCTAL_CMD_REG, Offset: 0x08)
- Renamed: Formerly SPI_CMD_CODE_REG. Renamed to OCTAL_CMD_REG across all software drivers.
- Bits [15:0]: CMD_CODE. 16-bit flash instruction opcode to support 2-byte Octal DTR commands.

### 3.3 FIFO Architecture
- Integrated hardware TX/RX FIFO depth is quadrupled from 16 bytes to 64 bytes (FIFO_DEPTH = 64) to buffer 16-word burst bursts.

### 3.4 Interrupt Status (Offset: 0x18)
- Bit [6]: CRC_ERROR_IRQ. (New interrupt source triggered upon transmission CRC parity check failure).

## 4. Operational Timing
### 4.1 Read Dummy Cycles
At 133MHz Octal DTR operation, dummy clock cycles requirement is relaxed from 6 cycles to 10 clock cycles (DUMMY_CYCLES = 10) to accommodate memory die access latency.
`;

const SPI_ARTIFACTS: ArtifactFile[] = [
  {
    id: 'spi-art-1',
    name: 'rtl/qspi_octal_top.sv',
    type: 'RTL',
    language: 'systemverilog',
    content: `module qspi_octal_top (
  input  logic       clk,
  input  logic       rst_n,
  output logic       sck,
  output logic       cs_n,         // Stale: Spec v2 inverted to active-high cs_en!
  inout  logic [3:0] io_bus        // Stale: Spec v2 expanded to 8 bits io[7:0]!
);

  localparam FIFO_DEPTH = 16;      // Stale: Spec v2 expanded FIFO_DEPTH to 64 bytes!
  logic [7:0] cmd_reg;             // Stale: Widened to 16 bits in v2
  logic cpol_reg;
  logic three_wire_mode;           // Stale: 3-wire mode removed in v2

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      cpol_reg        <= 1'b0;     // Stale: Spec v2 reset value for CPOL is 1'b1
      three_wire_mode <= 1'b0;
    end
  end

  // Notice: Missing CRC_ERROR_IRQ generator
endmodule
`,
  },
  {
    id: 'spi-art-2',
    name: 'regs/qspi_regs.h',
    type: 'Registers',
    language: 'c',
    content: `#ifndef QSPI_REGS_H
#define QSPI_REGS_H

#define REG_SPI_CTRL             0x00
#define REG_SPI_CMD_CODE         0x08    // Renamed in v2 to OCTAL_CMD_REG
#define REG_SPI_STATUS           0x18

#define SPI_FIFO_DEPTH_BYTES     16      // Stale: v2 changed to 64 bytes
#define SPI_CPOL_RESET_VAL       0       // Stale: v2 changed to 1

#define SPI_THREE_WIRE_EN_BIT    5       // Stale: Deprecated in v2

// Missing #define SPI_STAT_CRC_ERROR (1U << 6)

#endif
`,
  },
  {
    id: 'spi-art-3',
    name: 'sva/qspi_assertions.sv',
    type: 'Assertions',
    language: 'systemverilog',
    content: `module qspi_assertions (
  input logic clk,
  input logic rst_n,
  input logic [3:0] dummy_cycle_counter
);

  // Assertion: Check read dummy cycles <= 6
  // Stale: Spec v2 relaxed dummy cycle count to 10 cycles!
  property p_dummy_cycles_check;
    @(posedge clk) disable iff (!rst_n)
    dummy_cycle_counter <= 4'd6;
  endproperty
  assert_dummy_cycles: assert property (p_dummy_cycles_check)
    else $error("Dummy cycles exceeded 6!");

  // Assertion: Check cs_n is low during transfer
  property p_cs_active_low;
    @(posedge clk) disable iff (!rst_n)
    (cs_n == 1'b0);
  endproperty

  // GAP: No SVA check for Octal DTR differential strobe!
endmodule
`,
  },
  {
    id: 'spi-art-4',
    name: 'docs/qspi_testplan.md',
    type: 'Testplan',
    language: 'markdown',
    content: `# QSPI Controller Test Plan

| Test ID | Description | Targeted Feature |
| :--- | :--- | :--- |
| **TC_SPI_FIFO_01** | Test FIFO depth wrapping at 16 bytes | FIFO Controller |
| **TC_SPI_CS_01** | Verify cs_n active-low assertion | Chip Select |
| **TC_SPI_DUMMY_01**| Check dummy cycles timing <= 6 cycles | Fast Read |
| **TC_SPI_3WIRE** | Verify 3-wire legacy mode | 3-Wire Interface |

### Verification Gaps:
- No test for Octal DTR 8-bit bus transfers.
- No test for CRC_ERROR_IRQ (bit 6).
`,
  },
];

const SPI_GROUND_TRUTH: GroundTruthItem[] = [
  {
    id: 'SPI-GT-1',
    title: 'FIFO Depth Widened (16 Bytes to 64 Bytes)',
    change_type: 'width',
    clause: 'Section 3.3',
    description: 'Hardware FIFO depth quadrupled from 16 bytes to 64 bytes',
    keywords: ['fifo', 'depth', '64', '16', 'width'],
    expected_stale_files: ['rtl/qspi_octal_top.sv', 'regs/qspi_regs.h', 'docs/qspi_testplan.md'],
  },
  {
    id: 'SPI-GT-2',
    title: 'Chip Select Polarity Inverted (cs_n to cs_en)',
    change_type: 'polarity',
    clause: 'Section 2.1',
    description: 'cs_n active-low inverted to active-high cs_en',
    keywords: ['cs_n', 'cs_en', 'polarity', 'chip select'],
    expected_stale_files: ['rtl/qspi_octal_top.sv', 'sva/qspi_assertions.sv', 'docs/qspi_testplan.md'],
  },
  {
    id: 'SPI-GT-3',
    title: 'CPOL Default Reset Value Changed (0 to 1)',
    change_type: 'reset_value',
    clause: 'Section 3.1',
    description: 'CPOL clock polarity reset value changed from 0 (idle low) to 1 (idle high)',
    keywords: ['cpol', 'reset', 'polarity', 'idle high'],
    expected_stale_files: ['rtl/qspi_octal_top.sv', 'regs/qspi_regs.h'],
  },
  {
    id: 'SPI-GT-4',
    title: 'Command Register Renamed to OCTAL_CMD_REG',
    change_type: 'rename',
    clause: 'Section 3.2',
    description: 'SPI_CMD_CODE_REG renamed to OCTAL_CMD_REG',
    keywords: ['rename', 'cmd', 'octal_cmd', '0x08'],
    expected_stale_files: ['regs/qspi_regs.h'],
  },
  {
    id: 'SPI-GT-5',
    title: 'Legacy 3-Wire Mode Removed',
    change_type: 'removed',
    clause: 'Section 3.1',
    description: 'THREE_WIRE_MODE bit 5 removed from control register',
    keywords: ['three_wire', 'removed', 'deprecated'],
    expected_stale_files: ['rtl/qspi_octal_top.sv', 'regs/qspi_regs.h', 'docs/qspi_testplan.md'],
  },
  {
    id: 'SPI-GT-6',
    title: 'Octal DTR Protocol Mode Added',
    change_type: 'new_feature',
    clause: 'Section 1.0',
    description: 'Added 8-bit bidirectional Octal Double Transfer Rate (O-DTR) transfer protocol',
    keywords: ['octal', 'dtr', 'protocol', '8-bit'],
    expected_stale_files: ['rtl/qspi_octal_top.sv'],
    expected_gaps: ['Assertions', 'Coverage', 'Testplan'],
  },
  {
    id: 'SPI-GT-7',
    title: 'Read Dummy Cycles Relaxed (6 to 10 cycles)',
    change_type: 'timing',
    clause: 'Section 4.1',
    description: 'Read dummy cycles relaxed from 6 to 10 clock cycles for 133MHz operation',
    keywords: ['dummy', 'cycles', 'timing', '10', 'latency'],
    expected_stale_files: ['sva/qspi_assertions.sv', 'docs/qspi_testplan.md'],
  },
  {
    id: 'SPI-GT-8',
    title: 'New Interrupt CRC_ERROR_IRQ Added',
    change_type: 'new_feature',
    clause: 'Section 3.4',
    description: 'Added bit 6 CRC_ERROR_IRQ in interrupt status register',
    keywords: ['crc', 'error', 'interrupt', 'bit 6', 'irq'],
    expected_stale_files: ['regs/qspi_regs.h', 'rtl/qspi_octal_top.sv'],
    expected_gaps: ['Coverage', 'Testplan'],
  },
];

const SPI_PRECOMPUTED_CHANGES: SpecChange[] = [
  {
    id: 'CHG-1',
    change_type: 'width',
    spec_clause: 'Section 3.3',
    old_value: 'FIFO depth: 16 bytes (FIFO_DEPTH = 16)',
    new_value: 'FIFO depth: 64 bytes (FIFO_DEPTH = 64)',
    summary: 'Quadrupled hardware FIFO buffer capacity from 16 bytes to 64 bytes',
    severity: 'major',
  },
  {
    id: 'CHG-2',
    change_type: 'polarity',
    spec_clause: 'Section 2.1',
    old_value: 'cs_n active-low chip select output (asserted 1\'b0)',
    new_value: 'cs_en active-high chip select output (asserted 1\'b1)',
    summary: 'Inverted chip select pin polarity from active-low (cs_n) to active-high (cs_en)',
    severity: 'critical',
  },
  {
    id: 'CHG-3',
    change_type: 'reset_value',
    spec_clause: 'Section 3.1',
    old_value: 'CPOL clock polarity default reset value: 1\'b0 (SCK idles low)',
    new_value: 'CPOL clock polarity default reset value: 1\'b1 (SCK idles high)',
    summary: 'Changed SPI clock polarity CPOL default power-on reset state to 1 (idle high)',
    severity: 'major',
  },
  {
    id: 'CHG-4',
    change_type: 'rename',
    spec_clause: 'Section 3.2',
    old_value: 'SPI_CMD_CODE_REG (Offset 0x08, 8-bit)',
    new_value: 'OCTAL_CMD_REG (Offset 0x08, 16-bit)',
    summary: 'Renamed command register to OCTAL_CMD_REG and expanded width to 16 bits',
    severity: 'minor',
  },
  {
    id: 'CHG-5',
    change_type: 'removed',
    spec_clause: 'Section 3.1',
    old_value: 'THREE_WIRE_MODE (bit 5) in SPI_CTRL_REG',
    new_value: 'THREE_WIRE_MODE removed; bit 5 is reserved and read-only 0',
    summary: 'Removed deprecated 3-wire legacy serial mode from hardware',
    severity: 'minor',
  },
  {
    id: 'CHG-6',
    change_type: 'new_feature',
    spec_clause: 'Section 1.0',
    old_value: 'Standard SPI and Quad-SPI 4-bit bus interface',
    new_value: 'Octal Double Transfer Rate (O-DTR) 8-bit bus protocol supported',
    summary: 'Added Octal-SPI DTR mode with 8-bit bidirectional data bus',
    severity: 'critical',
  },
  {
    id: 'CHG-7',
    change_type: 'timing',
    spec_clause: 'Section 4.1',
    old_value: 'Fast-read dummy cycles: 6 clock cycles',
    new_value: 'Fast-read dummy cycles: 10 clock cycles for 133MHz operation',
    summary: 'Relaxed read dummy cycles requirement from 6 to 10 clock cycles',
    severity: 'major',
  },
  {
    id: 'CHG-8',
    change_type: 'new_feature',
    spec_clause: 'Section 3.4',
    old_value: 'Bit 6 Reserved in interrupt status register',
    new_value: 'Bit 6 CRC_ERROR_IRQ interrupt added',
    summary: 'Added new interrupt source for transmission CRC verification errors',
    severity: 'major',
  },
];

const SPI_PRECOMPUTED_MAPPINGS: ArtifactMapping[] = [
  {
    change_id: 'CHG-1',
    file: 'rtl/qspi_octal_top.sv',
    line_range: '9-10',
    artifact_type: 'RTL',
    evidence_snippet: 'localparam FIFO_DEPTH = 16;      // Stale: Spec v2 expanded FIFO_DEPTH to 64 bytes!',
    why_stale: 'Localparam limits FIFO to 16 bytes, causing overflows under burst transfer modes.',
    confidence: 0.98,
    suggested_fix: 'localparam FIFO_DEPTH = 64; // 64 bytes per Spec v2',
  },
  {
    change_id: 'CHG-1',
    file: 'regs/qspi_regs.h',
    line_range: '8-9',
    artifact_type: 'Registers',
    evidence_snippet: '#define SPI_FIFO_DEPTH_BYTES     16      // Stale: v2 changed to 64 bytes',
    why_stale: 'Firmware driver limits buffer chunks to 16 bytes instead of utilizing 64-byte burst capability.',
    confidence: 0.99,
    suggested_fix: '#define SPI_FIFO_DEPTH_BYTES     64',
  },
  {
    change_id: 'CHG-2',
    file: 'rtl/qspi_octal_top.sv',
    line_range: '5-6',
    artifact_type: 'RTL',
    evidence_snippet: 'output logic       cs_n,         // Stale: Spec v2 inverted to active-high cs_en!',
    why_stale: 'Port declaration and drive logic assert active-low cs_n instead of active-high cs_en.',
    confidence: 0.99,
    suggested_fix: 'output logic cs_en; // Active-high chip select',
  },
  {
    change_id: 'CHG-2',
    file: 'sva/qspi_assertions.sv',
    line_range: '17-21',
    artifact_type: 'Assertions',
    evidence_snippet: 'property p_cs_active_low;\n  @(posedge clk) disable iff (!rst_n)\n  (cs_n == 1\'b0);\nendproperty',
    why_stale: 'Assertion expects chip select to be 0 during transfer; in Spec v2 cs_en must be 1.',
    confidence: 0.97,
    suggested_fix: 'property p_cs_active_high;\n  @(posedge clk) disable iff (!rst_n)\n  (cs_en == 1\'b1);\nendproperty',
  },
  {
    change_id: 'CHG-3',
    file: 'rtl/qspi_octal_top.sv',
    line_range: '16-17',
    artifact_type: 'RTL',
    evidence_snippet: 'cpol_reg        <= 1\'b0;     // Stale: Spec v2 reset value for CPOL is 1\'b1',
    why_stale: 'Reset assignment drives 0 into CPOL; new specification standardizes on idle-high clock.',
    confidence: 0.96,
    suggested_fix: 'cpol_reg <= 1\'b1; // Default reset idle-high per Spec v2',
  },
  {
    change_id: 'CHG-4',
    file: 'regs/qspi_regs.h',
    line_range: '5-6',
    artifact_type: 'Registers',
    evidence_snippet: '#define REG_SPI_CMD_CODE         0x08    // Renamed in v2 to OCTAL_CMD_REG',
    why_stale: 'Macro REG_SPI_CMD_CODE is obsolete; will trigger compilation failures in updated software.',
    confidence: 0.99,
    suggested_fix: '#define REG_OCTAL_CMD            0x08\n#define REG_SPI_CMD_CODE         REG_OCTAL_CMD',
  },
  {
    change_id: 'CHG-5',
    file: 'rtl/qspi_octal_top.sv',
    line_range: '12-13',
    artifact_type: 'RTL',
    evidence_snippet: 'logic three_wire_mode;           // Stale: 3-wire mode removed in v2',
    why_stale: 'Hardware retains 3-wire multiplexing logic for a feature removed in Spec v2.',
    confidence: 0.95,
    suggested_fix: '// Remove three_wire_mode register and associated pin tristate logic',
  },
  {
    change_id: 'CHG-7',
    file: 'sva/qspi_assertions.sv',
    line_range: '9-14',
    artifact_type: 'Assertions',
    evidence_snippet: 'property p_dummy_cycles_check;\n  @(posedge clk) disable iff (!rst_n)\n  dummy_cycle_counter <= 4\'d6;\nendproperty',
    why_stale: 'Assertion strictly checks dummy cycles <= 6. At 133MHz, 10 dummy cycles will cause false assertion failures.',
    confidence: 0.98,
    suggested_fix: 'property p_dummy_cycles_check;\n  @(posedge clk) disable iff (!rst_n)\n  dummy_cycle_counter <= 4\'d10; // 10 cycles\nendproperty',
  },
  {
    change_id: 'CHG-8',
    file: 'regs/qspi_regs.h',
    line_range: '13-14',
    artifact_type: 'Registers',
    evidence_snippet: '// Missing #define SPI_STAT_CRC_ERROR (1U << 6)',
    why_stale: 'Header lacks bitmask definition for bit 6 CRC_ERROR_IRQ.',
    confidence: 0.93,
    suggested_fix: '#define SPI_STAT_CRC_ERROR (1U << 6)',
  },
];

const SPI_PRECOMPUTED_GAPS: VerificationGap[] = [
  {
    change_id: 'CHG-6',
    change_summary: 'Added Octal-SPI DTR mode with 8-bit bidirectional data bus',
    missing_artifacts: ['Assertions', 'Coverage', 'Testplan'],
    recommendation: 'Add SVA assertion checking differential data strobe DQS timing relative to SCK. Add covergroup sampling 8-bit bus transactions. Add verification testcase TC_OCTAL_DTR_READ to testplan.',
  },
  {
    change_id: 'CHG-8',
    change_summary: 'Added new interrupt source for transmission CRC verification errors (bit 6)',
    missing_artifacts: ['Coverage', 'Testplan'],
    recommendation: 'Add coverage bin for CRC error interrupt. Add testcase TC_CRC_CORRUPT stimulating corrupted payload data.',
  },
];

// --------------------------------------------------------------------------
// ALL AVAILABLE IP PRESETS
// --------------------------------------------------------------------------
export const ALL_IP_PRESETS: IPPreset[] = [
  {
    id: 'uart_dma',
    name: 'AXI_UART_DMA_IP',
    category: 'Embedded & Control Subsystem',
    description: 'AXI4-Lite UART & Scatter-Gather DMA Peripheral with baud generator & interrupts',
    revisions: 'Rev 1.0.4 → Rev 2.0.0',
    specV1: UART_SPEC_V1,
    specV2: UART_SPEC_V2,
    artifacts: UART_ARTIFACTS,
    groundTruth: UART_GROUND_TRUTH,
    precomputedChanges: UART_CHANGES,
    precomputedMappings: UART_MAPPINGS,
    precomputedGaps: UART_GAPS,
  },
  {
    id: 'pcie_gen5',
    name: 'PCIE_GEN5_CTRL_IP',
    category: 'High-Speed Interconnect Subsystem',
    description: 'PCIe Gen4 to Gen5 Controller with 512-bit datapath, 32 GT/s PHY, & AER',
    revisions: 'Rev 4.1.0 → Rev 5.0.0',
    specV1: PCIE_SPEC_V1,
    specV2: PCIE_SPEC_V2,
    artifacts: PCIE_ARTIFACTS,
    groundTruth: PCIE_GROUND_TRUTH,
    precomputedChanges: PCIE_PRECOMPUTED_CHANGES,
    precomputedMappings: PCIE_PRECOMPUTED_MAPPINGS,
    precomputedGaps: PCIE_PRECOMPUTED_GAPS,
  },
  {
    id: 'octal_spi',
    name: 'OCTAL_SPI_FLASH_IP',
    category: 'Memory & Storage Subsystem',
    description: 'Quad-SPI to Octal-DTR NOR Flash Memory Controller with 64B FIFO & CRC',
    revisions: 'Rev 1.2.0 → Rev 2.0.0',
    specV1: SPI_SPEC_V1,
    specV2: SPI_SPEC_V2,
    artifacts: SPI_ARTIFACTS,
    groundTruth: SPI_GROUND_TRUTH,
    precomputedChanges: SPI_PRECOMPUTED_CHANGES,
    precomputedMappings: SPI_PRECOMPUTED_MAPPINGS,
    precomputedGaps: SPI_PRECOMPUTED_GAPS,
  },
];
