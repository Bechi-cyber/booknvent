# LESAVOT UML Diagrams

This directory contains comprehensive UML diagrams for the LESAVOT Multimodal Steganography System, created in draw.io format.

## 📊 Diagram Overview

### 1. **Class Diagram** (`lesavot_class_diagram.drawio`)
**Purpose:** Shows the object-oriented structure of the LESAVOT system

**Key Components:**
- **User Class:** User management with authentication attributes and methods
- **StegOperation (Abstract):** Base class for all steganographic operations
- **TextSteganography:** Handles text-based steganography using whitespace techniques
- **ImageSteganography:** Implements LSB steganography for images
- **AudioSteganography:** Uses phase encoding for audio steganography
- **MultimodalSteganography:** Coordinates multiple steganographic modalities
- **Authentication:** Manages user sessions and security validation

**Relationships:**
- Inheritance: Text/Image/Audio steganography classes extend StegOperation
- Composition: MultimodalSteganography contains instances of all steganography classes
- Association: User has one-to-many relationship with StegOperation

### 2. **Activity Diagram** (`lesavot_activity_diagram.drawio`)
**Purpose:** Illustrates the complete workflow for steganographic operations

**Key Workflow Steps:**
1. **User Authentication:** Login validation and session management
2. **Operation Selection:** Choose between encrypt/decrypt modes
3. **Modality Selection:** Select text, image, audio, or multimodal steganography
4. **File Processing:** Upload, validate, and process input files
5. **Password Management:** Secure password input and validation
6. **Operation Execution:** Perform steganographic algorithms
7. **Result Generation:** Create and deliver output files

**Decision Points:**
- Authentication success/failure
- File validation results
- Operation success/failure
- Modality-specific processing branches

**Error Handling:**
- Authentication errors loop back to login
- Validation errors return to file upload
- Operation errors retry execution

### 3. **Use Case Diagram** (`lesavot_usecase_diagram.drawio`)
**Purpose:** Shows user interactions and system functionality from user perspective

**Actors:**
- **End User:** Regular users performing steganographic operations
- **Administrator:** System administrators managing the platform
- **Guest User:** Unauthenticated users with limited access

**Core Use Cases:**
- **Authentication:** Register, login, logout
- **Steganography Operations:** Text, image, audio, and multimodal steganography
- **File Management:** Upload files, download results, manage operation history
- **Profile Management:** Update profile, change password
- **Administration:** Manage users, monitor system, view logs, configure system
- **Guest Access:** View demo, access platform information

**Relationships:**
- **Include:** Core operations include encryption, decryption, and password validation
- **Extend:** Multimodal steganography extends individual modality operations
- **Association:** Lines connecting actors to their available use cases

## 🎨 Design Specifications

### **Color Coding:**
- **Blue (#dae8fc):** User management and authentication
- **Yellow (#fff2cc):** Decision points and file operations
- **Purple (#e1d5e7):** Core steganography operations
- **Green (#d5e8d4):** Security and processing functions
- **Red (#f8cecc):** Administrative and multimodal functions

### **Diagram Standards:**
- **Professional Layout:** Clean, organized, and easy to read
- **Consistent Styling:** Uniform colors, fonts, and spacing
- **Clear Relationships:** Proper UML notation for associations, inheritance, and dependencies
- **Comprehensive Coverage:** All major system components and interactions included

## 🔧 Usage Instructions

### **Opening the Diagrams:**
1. Go to [draw.io](https://app.diagrams.net/)
2. Click "Open Existing Diagram"
3. Select the desired `.drawio` file from this directory
4. The diagram will load in the draw.io editor

### **Editing the Diagrams:**
1. Open the diagram in draw.io
2. Use the toolbar and shape libraries to modify elements
3. Maintain consistent styling and color schemes
4. Save changes to preserve modifications

### **Exporting Diagrams:**
1. Open the diagram in draw.io
2. Go to File → Export as → PNG/PDF/SVG
3. Choose appropriate resolution and quality settings
4. Save exported files for documentation or presentations

## 📁 Integration with Thesis

These diagrams are referenced in the THESIS.md document under **APPENDIX I: SYSTEM DIAGRAMS**. To integrate:

1. Export each diagram as high-quality PNG files
2. Save them in a `figures/` directory
3. Use the naming convention:
   - `lesavot_class_diagram.png`
   - `lesavot_activity_diagram.png`
   - `lesavot_use_case_diagram.png`
4. The LaTeX figure references in the thesis will automatically link to these files

## 🔄 Maintenance

### **Updating Diagrams:**
- Keep diagrams synchronized with code changes
- Update relationships when system architecture evolves
- Maintain consistency across all three diagram types
- Document any major changes in this README

### **Version Control:**
- Commit diagram changes with descriptive messages
- Tag major diagram revisions
- Maintain backup copies of working versions

## 📋 Validation Checklist

- [ ] All major system classes represented in class diagram
- [ ] Complete workflow covered in activity diagram
- [ ] All user interactions included in use case diagram
- [ ] Proper UML notation used throughout
- [ ] Consistent color coding and styling
- [ ] Clear and readable labels
- [ ] Appropriate level of detail for academic documentation

These diagrams provide comprehensive visual documentation of the LESAVOT system architecture, supporting both development and academic presentation requirements.
