export interface ArtifactFile {
  id: string;
  name: string;
  type: 'RTL' | 'Registers' | 'UVM/TB' | 'Assertions' | 'Coverage' | 'Testplan';
  content: string;
  language: string;
}

export interface GroundTruthItem {
  id: string;
  title: string;
  change_type: string;
  clause: string;
  description: string;
  keywords: string[];
  expected_stale_files: string[];
  expected_gaps?: string[];
}

export const DEMO_SPEC_V1 = `# HARDWARE SPECIFICATION: AXI4-Lite UART & Scatter-Gather DMA Peripheral (AXI_UART_DMA_IP)
Revision: 1.0.4
Status: Approved

## 1. Architectural Overview
The AXI_UART_DMA_IP provides asynchronous serial communication (UART) paired with an integrated direct memory access (DMA) engine. It connects to the system fabric via an AXI4-Lite slave bus.

## 2. Interface Signals & Pinout
### 2.1 System Pins
- aclk: System clock input (nominal 100MHz).
- aresetn: Active-low asynchronous reset, de-asserted synchronously.

### 2.2 Peripheral Handshake Signals
- uart_tx: Serial transmit pin.
- uart_rx: Serial receive pin.
- dma_req_n: DMA transfer request handshake signal to external interconnect. Active-low (asserted 1'b0 when FIFO data is ready for DMA).
- dma_ack: DMA transfer acknowledgment signal from external DMA arbiter. Active-high pulse.

## 3. Register Map Definition (Base Address: 0x4000_0000)
All registers are 32-bit word-aligned.

### 3.1 Control Register (CTRL_REG, Offset: 0x00)
- Bit [0]: UART_EN. 1'b1 = Enable UART transceiver. Default reset: 1'b0.
- Bit [1]: DMA_EN. 1'b1 = Enable DMA engine. Default reset: 1'b0 (Disabled at reset).
- Bit [2]: TX_INT_EN. 1'b1 = Enable TX FIFO empty interrupt. Default reset: 1'b0.
- Bit [3]: RX_INT_EN. 1'b1 = Enable RX FIFO available interrupt. Default reset: 1'b0.
- Bit [4]: LOOPBACK_EN. 1'b1 = Diagnostic loopback mode: TX shift register internally routes to RX. Default reset: 1'b0.
- Bits [31:5]: Reserved. Read as 0.

### 3.2 Baud Rate Divisor Register (UART_BAUD_REG, Offset: 0x08)
- Bits [7:0]: BAUD_DIV. 8-bit programmable divisor for UART baud rate generator clock divider.
  Formula: Baud Rate = aclk / (16 * (BAUD_DIV + 1)).
  Divisor range: 0 to 255. Default reset: 8'h1B (115200 baud @ 50MHz).
- Bits [31:8]: Reserved. Read as 0.

### 3.3 Interrupt Mask Register (INT_MASK_REG, Offset: 0x14)
- Bit [0]: TX_EMPTY_MASK. 1'b1 = Unmask interrupt.
- Bit [1]: RX_FULL_MASK. 1'b1 = Unmask interrupt.
- Bit [2]: TX_DONE_MASK. 1'b1 = Unmask interrupt.
- Bit [3]: DMA_COMPLETE_MASK. 1'b1 = Unmask interrupt.
- Bits [31:4]: Reserved.

### 3.4 Interrupt Status Register (INT_STATUS_REG, Offset: 0x18)
- Bit [0]: TX_EMPTY_IRQ. Read 1 if TX FIFO empty. Write 1 to clear.
- Bit [1]: RX_FULL_IRQ. Read 1 if RX FIFO full. Write 1 to clear.
- Bit [2]: TX_DONE_IRQ. Read 1 if frame shift complete. Write 1 to clear.
- Bit [3]: DMA_COMPLETE_IRQ. Read 1 if DMA buffer completed. Write 1 to clear.
- Bits [31:4]: Reserved.

## 4. DMA Subsystem Operations
### 4.1 DMA Transfer Protocol
The integrated DMA operates strictly in single-beat cycle-stealing mode. Each transfer transaction transmits a single 32-bit data word upon assertion of dma_req_n. No burst transactions are supported.

## 5. Interface Protocol & Timing Constraints
### 5.1 Bus Protocol
AXI4-Lite conforms to ARM IHI 0022E specifications.

### 5.3 Handshake Latency Constraints
Interface handshake response: tx_ready must assert within a strict maximum of 2 clock cycles following assertion of tx_valid (MAX_TX_READY_LATENCY = 2 cycles). Exceeding 2 cycles is an interface protocol violation.
`;

export const DEMO_SPEC_V2 = `# HARDWARE SPECIFICATION: AXI4-Lite UART & Scatter-Gather DMA Peripheral (AXI_UART_DMA_IP)
Revision: 2.0.0
Status: Approved for Tape-Out Rev B

## 1. Architectural Overview
The AXI_UART_DMA_IP provides high-performance asynchronous serial communication (UART) paired with an enhanced scatter-gather direct memory access (DMA) engine with burst support.

## 2. Interface Signals & Pinout
### 2.1 System Pins
- aclk: System clock input (nominal 100MHz).
- aresetn: Active-low asynchronous reset, de-asserted synchronously.

### 2.2 Peripheral Handshake Signals
- uart_tx: Serial transmit pin.
- uart_rx: Serial receive pin.
- dma_req: DMA transfer request handshake signal to external interconnect. Active-high (asserted 1'b1 when FIFO data is ready for DMA). Changed from active-low dma_req_n to standardize with AMBA AXI DMA peripheral interface specifications.
- dma_ack: DMA transfer acknowledgment signal from external DMA arbiter. Active-high pulse.

## 3. Register Map Definition (Base Address: 0x4000_0000)
All registers are 32-bit word-aligned.

### 3.1 Control Register (CTRL_REG, Offset: 0x00)
- Bit [0]: UART_EN. 1'b1 = Enable UART transceiver. Default reset: 1'b0.
- Bit [1]: DMA_EN. 1'b1 = Enable DMA engine. Default reset: 1'b1 (Enabled by default upon system power-on reset for autonomous bootloading).
- Bit [2]: TX_INT_EN. 1'b1 = Enable TX FIFO empty interrupt. Default reset: 1'b0.
- Bit [3]: RX_INT_EN. 1'b1 = Enable RX FIFO available interrupt. Default reset: 1'b0.
- Bit [4]: Reserved. (LOOPBACK_EN was removed and deprecated; diagnostic loopback is now migrated to dedicated system BIST controller. Writing to bit 4 has no effect and reads return 0).
- Bits [31:5]: Reserved. Read as 0.

### 3.2 Baud Rate Divisor Register (UART_BAUD_REG, Offset: 0x08)
- Bits [11:0]: BAUD_DIV. 12-bit programmable divisor for UART baud rate generator clock divider (widened from 8-bit to 12-bit to support low baud rates at 200MHz system clocks).
  Formula: Baud Rate = aclk / (16 * (BAUD_DIV + 1)).
  Divisor range: 0 to 4095. Default reset: 12'h01B.
- Bits [31:12]: Reserved. Read as 0.

### 3.3 Interrupt Enable Register (INT_ENABLE_REG, Offset: 0x14)
- Renamed: Formerly INT_MASK_REG. Renamed to INT_ENABLE_REG across all hardware and firmware headers to align with corporate register naming standards.
- Bit [0]: TX_EMPTY_EN. 1'b1 = Enable interrupt.
- Bit [1]: RX_FULL_EN. 1'b1 = Enable interrupt.
- Bit [2]: TX_DONE_EN. 1'b1 = Enable interrupt.
- Bit [3]: DMA_COMPLETE_EN. 1'b1 = Enable interrupt.
- Bit [5]: FIFO_ALMOST_FULL_EN. 1'b1 = Enable interrupt.
- Bits [31:6]: Reserved.

### 3.4 Interrupt Status Register (INT_STATUS_REG, Offset: 0x18)
- Bit [0]: TX_EMPTY_IRQ. Read 1 if TX FIFO empty. Write 1 to clear.
- Bit [1]: RX_FULL_IRQ. Read 1 if RX FIFO full. Write 1 to clear.
- Bit [2]: TX_DONE_IRQ. Read 1 if frame shift complete. Write 1 to clear.
- Bit [3]: DMA_COMPLETE_IRQ. Read 1 if DMA buffer completed. Write 1 to clear.
- Bit [5]: FIFO_ALMOST_FULL_IRQ. Read 1 when RX FIFO occupancy reaches programmable threshold watermark. Write 1 to clear. (New interrupt source).
- Bits [31:6]: Reserved.

## 4. DMA Subsystem Operations
### 4.1 DMA Transfer Protocol & Burst Mode
The integrated DMA now supports programmable burst transfer modes configured in DMA_CFG_REG (Offset 0x10) bits [3:2]:
- 2'b00: Single-beat transfer (legacy mode)
- 2'b01: INCR4 4-beat burst transfer
- 2'b10: INCR8 8-beat burst transfer
- 2'b11: Reserved
Burst transfers streamline AXI bus throughput and prevent bus starvation during high-speed UART reception.

## 5. Interface Protocol & Timing Constraints
### 5.1 Bus Protocol
AXI4-Lite conforms to ARM IHI 0022E specifications.

### 5.3 Handshake Latency Constraints
Interface handshake response timing has been relaxed: tx_ready response latency requirement is increased from 2 clock cycles to a maximum of 4 clock cycles following assertion of tx_valid (MAX_TX_READY_LATENCY = 4 cycles) to accommodate asynchronous FIFO synchronization stages.
`;

export const DEMO_ARTIFACTS: ArtifactFile[] = [
  {
    id: 'art-1',
    name: 'rtl/uart_dma_top.sv',
    type: 'RTL',
    language: 'systemverilog',
    content: `// ==============================================================================
// Module: uart_dma_top
// Description: AXI4-Lite UART & DMA Subsystem Top-level RTL
// ==============================================================================
module uart_dma_top (
  input  logic        aclk,
  input  logic        aresetn,
  
  // AXI4-Lite Slave Interface
  input  logic [31:0] s_axi_awaddr,
  input  logic        s_axi_awvalid,
  output logic        s_axi_awready,
  input  logic [31:0] s_axi_wdata,
  input  logic [3:0]  s_axi_wstrb,
  input  logic        s_axi_wvalid,
  output logic        s_axi_wready,
  
  // Peripheral External Pins
  output logic        uart_tx,
  input  logic        uart_rx,
  output logic        dma_req_n,    // Active-low DMA request to arbiter
  input  logic        dma_ack
);

  // Internal Registers
  logic [31:0] ctrl_reg;
  logic [7:0]  baud_div_reg;       // 8-bit baud divisor register
  logic [31:0] int_mask_reg;       // Interrupt Mask Register
  logic [31:0] int_status_reg;
  logic        loopback_en;
  logic        dma_en;
  logic        rx_internal;

  // Control Register decode
  assign dma_en      = ctrl_reg[1];
  assign loopback_en = ctrl_reg[4]; // Loopback mode enable bit
  assign rx_internal = loopback_en ? uart_tx : uart_rx;

  // Active-low DMA Request Generation
  assign dma_req_n   = ~(dma_en && (int_status_reg[1] == 1'b1)); // Assert low when active

  // Reset and Register write logic
  always_ff @(posedge aclk or negedge aresetn) begin
    if (!aresetn) begin
      ctrl_reg       <= 32'h0000_0000; // Reset value: DMA_EN = 0 (disabled)
      baud_div_reg   <= 8'h1B;         // Reset value: 8-bit divisor 27
      int_mask_reg   <= 32'h0000_0000;
      int_status_reg <= 32'h0000_0000;
    end else if (s_axi_wvalid && s_axi_awvalid) begin
      case (s_axi_awaddr[7:0])
        8'h00: ctrl_reg       <= s_axi_wdata;
        8'h08: baud_div_reg   <= s_axi_wdata[7:0]; // Extracts only lower 8 bits!
        8'h14: int_mask_reg   <= s_axi_wdata;      // Stale INT_MASK_REG offset
        8'h18: int_status_reg <= int_status_reg & ~s_axi_wdata;
      endcase
    end
  end

  // Notice: No decoding for DMA burst modes (DMA_CFG_REG bits [3:2])
  // Notice: No bit 5 interrupt mapping for FIFO_ALMOST_FULL_IRQ

endmodule
`,
  },
  {
    id: 'art-2',
    name: 'regs/uart_dma_regs.h',
    type: 'Registers',
    language: 'c',
    content: `/*
 * AXI_UART_DMA_IP Register Definitions Header
 * Software Driver & Register Abstraction
 */

#ifndef UART_DMA_REGS_H
#define UART_DMA_REGS_H

#include <stdint.h>

// Register Offsets
#define REG_CTRL              0x00
#define REG_STATUS            0x04
#define REG_BAUD_DIV          0x08
#define REG_INT_MASK          0x14  // Renamed to INT_ENABLE_REG in v2 spec
#define REG_INT_STATUS        0x18

// Control Register (REG_CTRL) Bitfields
#define CTRL_UART_EN_BIT      0
#define CTRL_DMA_EN_BIT       1
#define CTRL_DMA_EN_RESET_VAL 0     // Changed to 1 in v2 spec
#define CTRL_LOOPBACK_EN_BIT  4     // Deprecated/removed in v2 spec
#define CTRL_LOOPBACK_EN_MASK (1U << CTRL_LOOPBACK_EN_BIT)

// Baud Divisor Register (REG_BAUD_DIV)
#define UART_BAUD_DIV_WIDTH   8     // Widened to 12 bits in v2
#define UART_BAUD_DIV_MASK    0x000000FFU // Needs expansion to 0x00000FFF
#define UART_BAUD_DIV_MAX     255

// Interrupt Status Bits
#define INT_STAT_TX_EMPTY     (1U << 0)
#define INT_STAT_RX_FULL      (1U << 1)
#define INT_STAT_TX_DONE      (1U << 2)
#define INT_STAT_DMA_COMP     (1U << 3)
// Missing #define INT_STAT_FIFO_ALMOST_FULL (1U << 5)

#endif // UART_DMA_REGS_H
`,
  },
  {
    id: 'art-3',
    name: 'sva/uart_dma_assertions.sv',
    type: 'Assertions',
    language: 'systemverilog',
    content: `// ==============================================================================
// SystemVerilog Assertions (SVA) for AXI_UART_DMA_IP
// ==============================================================================
module uart_dma_assertions (
  input logic aclk,
  input logic aresetn,
  input logic tx_valid,
  input logic tx_ready,
  input logic dma_req_n,
  input logic [31:0] ctrl_reg
);

  // Assertion: Check that reset clears DMA_EN
  property p_reset_dma_disabled;
    @(posedge aclk)
    (!aresetn) |-> (ctrl_reg[1] == 1'b0); // Stale: v2 spec reset value is 1'b1!
  endproperty
  assert_reset_dma: assert property (p_reset_dma_disabled)
    else $error("Assertion failure: DMA_EN was not 0 after reset");

  // Assertion: tx_ready latency constraint (Spec v1 required <= 2 cycles)
  // Spec v2 relaxed timing to <= 4 cycles! This assertion will cause false failures!
  property p_tx_ready_handshake_latency;
    @(posedge aclk) disable iff (!aresetn)
    tx_valid |-> ##[1:2] tx_ready;
  endproperty
  assert_tx_ready_latency: assert property (p_tx_ready_handshake_latency)
    else $error("Timing violation: tx_ready took more than 2 cycles");

  // Assertion: DMA Request pin polarity active-low
  // Spec v2 changed signal to active-high dma_req!
  property p_dma_req_active_low_check;
    @(posedge aclk) disable iff (!aresetn)
    (ctrl_reg[1] == 1'b1) |-> (dma_req_n === 1'b0 || dma_req_n === 1'b1);
  endproperty

  // GAP NOTICE: No assertion defined for BURST_MODE transfers!
  // GAP NOTICE: No assertion defined for FIFO_ALMOST_FULL_IRQ assertion!

endmodule
`,
  },
  {
    id: 'art-4',
    name: 'tb/uart_dma_uvm_env.sv',
    type: 'UVM/TB',
    language: 'systemverilog',
    content: `// ==============================================================================
// UVM Testbench Environment Component
// ==============================================================================
class uart_dma_uvm_env extends uvm_env;
  \`uvm_component_utils(uart_dma_uvm_env)

  uart_sequencer seqr;
  uart_driver    driver;
  uart_monitor   monitor;

  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction

  virtual task run_phase(uvm_phase phase);
    uvm_reg_data_t rdata;
    // Program interrupt masks using old register name
    reg_block.int_mask_reg.read(status, rdata); // Stale reference to int_mask_reg
    \`uvm_info("UVM_ENV", $sformatf("Read int_mask_reg = 0x%0h", rdata), UVM_LOW)
    
    // Test loopback setup sequence
    reg_block.ctrl_reg.loopback_en.set(1'b1);   // Stale: loopback bit deprecated
    reg_block.ctrl_reg.update(status);
  endtask
endclass
`,
  },
  {
    id: 'art-5',
    name: 'cov/uart_dma_coverage.sv',
    type: 'Coverage',
    language: 'systemverilog',
    content: `// ==============================================================================
// Functional Coverage Model for AXI_UART_DMA_IP
// ==============================================================================
module uart_dma_coverage (
  input logic aclk,
  input logic [7:0] baud_div, // Stale: only sampling 8 bits instead of 12 bits
  input logic [3:0] interrupt_status
);

  covergroup cg_baud_rates @(posedge aclk);
    cp_baud: coverpoint baud_div {
      bins standard_9600   = {8'd27};
      bins standard_115200 = {8'd3};
      bins custom_range    = {[8'd0:8'd255]}; // Missing 12-bit range 256..4095
    }
  endgroup

  covergroup cg_interrupts @(posedge aclk);
    cp_irqs: coverpoint interrupt_status {
      bins tx_empty = {4'b0001};
      bins rx_full  = {4'b0010};
      bins tx_done  = {4'b0100};
      bins dma_done = {4'b1000};
      // GAP: Missing bin for FIFO_ALMOST_FULL_IRQ (bit 5)!
    }
  endgroup

  // GAP: Missing covergroup for DMA Burst Modes (INCR4, INCR8)!

endmodule
`,
  },
  {
    id: 'art-6',
    name: 'docs/uart_dma_testplan.md',
    type: 'Testplan',
    language: 'markdown',
    content: `# Verification Test Plan: AXI_UART_DMA_IP

## Testcase Matrix

| Testcase ID | Description | Targeted Features | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC_BAUD_01** | Verify baud rate divisor across 8-bit values (0-255). | Baud Generator | Bit rate matches divisor within 2% margin. |
| **TC_RESET_01** | Check default register values immediately after aresetn de-assertion. | Reset Controller | CTRL_REG equals 0x00 (DMA_EN is disabled). |
| **TC_LOOPBACK_01** | Set CTRL_REG[4] LOOPBACK_EN and verify serial data loopback. | Loopback Mode | Sent bytes looped back into RX FIFO. |
| **TC_TIMING_01** | Stimulate tx_valid and assert tx_ready arrives within <= 2 clock cycles. | AXI Handshake | Handshake completes in 1 to 2 cycles. |
| **TC_INT_MASK_01**| Write to INT_MASK_REG (0x14) and verify IRQ suppression. | Interrupt Masking | Suppressed interrupts do not assert IRQ line. |
| **TC_DMA_POLARITY**| Check dma_req_n active-low behavior during transfer. | DMA Handshake | dma_req_n falls to 0 upon FIFO request. |

### Verification Gaps Identified in v2:
- No testcase exists for **DMA Burst Mode** (INCR4 and INCR8).
- No testcase exists for **FIFO_ALMOST_FULL_IRQ** (bit 5).
`,
  },
];

export const DEMO_GROUND_TRUTH: GroundTruthItem[] = [
  {
    id: 'GT-1',
    title: 'Baud Divisor Widened (8-bit to 12-bit)',
    change_type: 'width',
    clause: 'Section 3.2',
    description: 'BAUD_DIV widened from 8 bits [7:0] to 12 bits [11:0]',
    keywords: ['baud', 'divisor', 'width', '12-bit', '8-bit', '0x08', 'baud_div'],
    expected_stale_files: ['rtl/uart_dma_top.sv', 'regs/uart_dma_regs.h', 'cov/uart_dma_coverage.sv', 'docs/uart_dma_testplan.md'],
  },
  {
    id: 'GT-2',
    title: 'DMA_EN Reset Value Inverted (0x0 to 0x1)',
    change_type: 'reset_value',
    clause: 'Section 3.1.2',
    description: 'CTRL_REG DMA_EN reset value changed from 0 (disabled) to 1 (enabled by default)',
    keywords: ['reset', 'dma_en', 'ctrl_reg', 'default', '1\'b1', '0x1'],
    expected_stale_files: ['rtl/uart_dma_top.sv', 'regs/uart_dma_regs.h', 'sva/uart_dma_assertions.sv', 'docs/uart_dma_testplan.md'],
  },
  {
    id: 'GT-3',
    title: 'DMA Burst Transfer Mode Added',
    change_type: 'new_feature',
    clause: 'Section 4.1',
    description: 'Added BURST_MODE (INCR4, INCR8) configured in DMA_CFG_REG[3:2]',
    keywords: ['burst', 'incr4', 'incr8', 'dma_cfg', 'mode'],
    expected_stale_files: ['rtl/uart_dma_top.sv'],
    expected_gaps: ['Assertions', 'Coverage', 'Testplan'],
  },
  {
    id: 'GT-4',
    title: 'TX Ready Latency Constraint Relaxed (2 to 4 cycles)',
    change_type: 'timing',
    clause: 'Section 5.3',
    description: 'tx_ready handshake response latency relaxed from max 2 cycles to max 4 cycles',
    keywords: ['timing', 'latency', 'tx_ready', 'cycles', 'handshake'],
    expected_stale_files: ['sva/uart_dma_assertions.sv', 'docs/uart_dma_testplan.md'],
  },
  {
    id: 'GT-5',
    title: 'INT_MASK_REG Renamed to INT_ENABLE_REG',
    change_type: 'rename',
    clause: 'Section 3.3',
    description: 'Register at offset 0x14 renamed from INT_MASK_REG to INT_ENABLE_REG',
    keywords: ['rename', 'int_mask', 'int_enable', '0x14'],
    expected_stale_files: ['rtl/uart_dma_top.sv', 'regs/uart_dma_regs.h', 'tb/uart_dma_uvm_env.sv', 'docs/uart_dma_testplan.md'],
  },
  {
    id: 'GT-6',
    title: 'DMA Request Polarity Inverted (Active-Low to Active-High)',
    change_type: 'polarity',
    clause: 'Section 2.2',
    description: 'dma_req_n active-low changed to dma_req active-high',
    keywords: ['polarity', 'dma_req', 'active-high', 'active-low', 'dma_req_n'],
    expected_stale_files: ['rtl/uart_dma_top.sv', 'sva/uart_dma_assertions.sv', 'docs/uart_dma_testplan.md'],
  },
  {
    id: 'GT-7',
    title: 'LOOPBACK_EN Removed / Deprecated',
    change_type: 'removed',
    clause: 'Section 3.1.3',
    description: 'Bit 4 LOOPBACK_EN in CTRL_REG deprecated and removed from hardware',
    keywords: ['loopback', 'removed', 'deprecated', 'ctrl_reg', 'bit 4'],
    expected_stale_files: ['rtl/uart_dma_top.sv', 'regs/uart_dma_regs.h', 'tb/uart_dma_uvm_env.sv', 'docs/uart_dma_testplan.md'],
  },
  {
    id: 'GT-8',
    title: 'New FIFO_ALMOST_FULL_IRQ Interrupt Added',
    change_type: 'new_feature',
    clause: 'Section 3.4',
    description: 'Added bit 5 FIFO_ALMOST_FULL_IRQ in INT_STATUS_REG',
    keywords: ['fifo_almost_full', 'interrupt', 'bit 5', 'watermark', 'irq'],
    expected_stale_files: ['regs/uart_dma_regs.h', 'rtl/uart_dma_top.sv'],
    expected_gaps: ['Assertions', 'Coverage', 'Testplan'],
  },
];
