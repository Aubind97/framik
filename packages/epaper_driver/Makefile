# Makefile for EPD 7in3e FFI Shared Library

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -O2 -fPIC -std=c99
LDFLAGS = -shared

# Platform detection
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
    SUFFIX = so
    LDLIBS = -lgpiod
endif
ifeq ($(UNAME_S),Darwin)
    SUFFIX = dylib
    LDFLAGS += -undefined dynamic_lookup
endif

# Directories
SRC_DIR = src/native
BUILD_DIR = build
LIB_DIR = lib

# Target library
TARGET = $(LIB_DIR)/libepd.$(SUFFIX)

# Source files
SOURCES = $(SRC_DIR)/epd_ffi.c \
          $(SRC_DIR)/EPD_7in3e.c \
          $(SRC_DIR)/DEV_Config.c \
          $(SRC_DIR)/RPI_gpiod.c \
          $(SRC_DIR)/dev_hardware_SPI.c \
          $(SRC_DIR)/sysfs_gpio.c \
          $(SRC_DIR)/sysfs_software_spi.c

# Object files
OBJECTS = $(SOURCES:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)

# Include directories
INCLUDES = -I$(SRC_DIR)

# Defines
DEFINES = -DRPI -DUSE_DEV_LIB -D_GNU_SOURCE -D_POSIX_C_SOURCE=200809L

# Default target
all: $(TARGET)

# Create directories
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(LIB_DIR):
	mkdir -p $(LIB_DIR)

# Build object files
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(DEFINES) $(INCLUDES) -c $< -o $@

# Build shared library
$(TARGET): $(OBJECTS) | $(LIB_DIR)
	$(CC) $(LDFLAGS) $(OBJECTS) $(LDLIBS) -o $@

# Build for Raspberry Pi (default)
build-rpi: DEFINES += -DRPI -DUSE_DEV_LIB
build-rpi: $(TARGET)

# Build for Jetson Nano
build-jetson: DEFINES += -DJETSON -DUSE_DEV_LIB
build-jetson: $(TARGET)

# Debug build
debug: CFLAGS += -g -DDEBUG
debug: $(TARGET)

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)
	rm -rf $(LIB_DIR)

# Install system dependencies (Raspberry Pi)
install-deps-rpi:
	@echo "Installing dependencies for Raspberry Pi..."
	sudo apt-get update
	sudo apt-get install -y build-essential libgpiod-dev

# Install system dependencies (Jetson Nano)
install-deps-jetson:
	@echo "Installing dependencies for Jetson Nano..."
	sudo apt-get update
	sudo apt-get install -y build-essential libgpiod-dev

# Check system dependencies
check-deps:
	@echo "Checking system dependencies..."
	@which gcc > /dev/null || (echo "Error: gcc not found" && exit 1)
	@pkg-config --exists libgpiod || (echo "Error: libgpiod-dev not found. Install with: sudo apt-get install libgpiod-dev" && exit 1)
	@echo "All dependencies found!"

# Test build (without hardware)
test-build: clean all
	@echo "Build test completed successfully!"
	@ls -la $(TARGET)

# Setup for development
setup: check-deps all

# Help
help:
	@echo "Available targets:"
	@echo "  all               - Build the shared library (default)"
	@echo "  build-rpi         - Build for Raspberry Pi"
	@echo "  build-jetson      - Build for Jetson Nano"
	@echo "  debug             - Build with debug information"
	@echo "  clean             - Clean build artifacts"
	@echo "  install-deps-rpi  - Install dependencies for Raspberry Pi"
	@echo "  install-deps-jetson - Install dependencies for Jetson Nano"
	@echo "  check-deps        - Check system dependencies"
	@echo "  test-build        - Clean build and test"
	@echo "  setup             - Full setup (check deps + build)"
	@echo "  help              - Show this help"

# Phony targets
.PHONY: all build-rpi build-jetson debug clean install-deps-rpi install-deps-jetson check-deps test-build setup help