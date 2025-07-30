/*****************************************************************************
* | File        :   epd_ffi.c
* | Author      :   Framik team
* | Function    :   FFI-compatible interface for EPD 7in3e
* | Info        :   Exposes C functions for Bun FFI usage
******************************************************************************/
#include "EPD_7in3e.h"
#include "DEV_Config.h"
#include <stdlib.h>
#include <string.h>

// Global state
static int is_initialized = 0;

// Initialize the e-Paper module
int epd_init(void) {
    if (is_initialized) {
        return 0; // Already initialized
    }

    if (DEV_Module_Init() != 0) {
        return -1; // Failed to initialize
    }

    EPD_7IN3E_Init();
    is_initialized = 1;
    return 0;
}

// Clear the display with a specified color
int epd_clear(int color) {
    if (!is_initialized) {
        return -1;
    }

    EPD_7IN3E_Clear((UBYTE)color);
    return 0;
}

// Display the 7-color block test pattern
int epd_show7block(void) {
    if (!is_initialized) {
        return -1;
    }

    EPD_7IN3E_Show7Block();
    return 0;
}

// Display the color test pattern
int epd_show(void) {
    if (!is_initialized) {
        return -1;
    }

    EPD_7IN3E_Show();
    return 0;
}

// Display an image buffer
int epd_display(unsigned char* image_buffer, int buffer_size) {
    if (!is_initialized || !image_buffer) {
        return -1;
    }

    // Calculate expected buffer size
    int width = (EPD_7IN3E_WIDTH % 2 == 0) ? (EPD_7IN3E_WIDTH / 2) : (EPD_7IN3E_WIDTH / 2 + 1);
    int height = EPD_7IN3E_HEIGHT;
    int expected_size = width * height;

    if (buffer_size != expected_size) {
        return -2; // Buffer size mismatch
    }

    EPD_7IN3E_Display(image_buffer);
    return 0;
}

// Put the display to sleep
int epd_sleep(void) {
    if (!is_initialized) {
        return -1;
    }

    EPD_7IN3E_Sleep();
    return 0;
}

// Exit and cleanup the module
int epd_exit(void) {
    if (!is_initialized) {
        return 0; // Already cleaned up
    }

    DEV_Module_Exit();
    is_initialized = 0;
    return 0;
}

// Get display width
int epd_get_width(void) {
    return EPD_7IN3E_WIDTH;
}

// Get display height
int epd_get_height(void) {
    return EPD_7IN3E_HEIGHT;
}

// Get buffer size needed for display
int epd_get_buffer_size(void) {
    int width = (EPD_7IN3E_WIDTH % 2 == 0) ? (EPD_7IN3E_WIDTH / 2) : (EPD_7IN3E_WIDTH / 2 + 1);
    int height = EPD_7IN3E_HEIGHT;
    return width * height;
}

// Get color constants
int epd_get_color_black(void) { return EPD_7IN3E_BLACK; }
int epd_get_color_white(void) { return EPD_7IN3E_WHITE; }
int epd_get_color_yellow(void) { return EPD_7IN3E_YELLOW; }
int epd_get_color_red(void) { return EPD_7IN3E_RED; }
int epd_get_color_blue(void) { return EPD_7IN3E_BLUE; }
int epd_get_color_green(void) { return EPD_7IN3E_GREEN; }

// Create a blank image buffer filled with specified color
unsigned char* epd_create_buffer(int color) {
    int buffer_size = epd_get_buffer_size();
    unsigned char* buffer = (unsigned char*)malloc(buffer_size);

    if (!buffer) {
        return NULL;
    }

    unsigned char fill_value = (unsigned char)((color << 4) | color);
    memset(buffer, fill_value, buffer_size);

    return buffer;
}

// Free a buffer created by epd_create_buffer
void epd_free_buffer(unsigned char* buffer) {
    if (buffer) {
        free(buffer);
    }
}

// Set a pixel in the image buffer
int epd_set_pixel(unsigned char* buffer, int x, int y, int color) {
    if (!buffer || x < 0 || y < 0 || x >= EPD_7IN3E_WIDTH || y >= EPD_7IN3E_HEIGHT) {
        return -1;
    }

    int width = (EPD_7IN3E_WIDTH % 2 == 0) ? (EPD_7IN3E_WIDTH / 2) : (EPD_7IN3E_WIDTH / 2 + 1);
    int byte_index = (y * width) + (x / 2);

    if (x % 2 == 0) {
        // Left pixel (upper 4 bits)
        buffer[byte_index] = (buffer[byte_index] & 0x0F) | ((color & 0x0F) << 4);
    } else {
        // Right pixel (lower 4 bits)
        buffer[byte_index] = (buffer[byte_index] & 0xF0) | (color & 0x0F);
    }

    return 0;
}

// Get a pixel from the image buffer
int epd_get_pixel(unsigned char* buffer, int x, int y) {
    if (!buffer || x < 0 || y < 0 || x >= EPD_7IN3E_WIDTH || y >= EPD_7IN3E_HEIGHT) {
        return -1;
    }

    int width = (EPD_7IN3E_WIDTH % 2 == 0) ? (EPD_7IN3E_WIDTH / 2) : (EPD_7IN3E_WIDTH / 2 + 1);
    int byte_index = (y * width) + (x / 2);

    if (x % 2 == 0) {
        // Left pixel (upper 4 bits)
        return (buffer[byte_index] >> 4) & 0x0F;
    } else {
        // Right pixel (lower 4 bits)
        return buffer[byte_index] & 0x0F;
    }
}

// Map RGB color to display color (simplified implementation)
int epd_map_rgb_to_display_color(int r, int g, int b) {
    // Exact color mapping for the 6-color palette
    if (r == 255 && g == 0 && b == 0) {
        return EPD_7IN3E_RED;
    }
    if (r == 0 && g == 255 && b == 0) {
        return EPD_7IN3E_GREEN;
    }
    if (r == 0 && g == 0 && b == 255) {
        return EPD_7IN3E_BLUE;
    }
    if (r == 255 && g == 255 && b == 0) {
        return EPD_7IN3E_YELLOW;
    }
    if (r == 0 && g == 0 && b == 0) {
        return EPD_7IN3E_BLACK;
    }
    if (r == 255 && g == 255 && b == 255) {
        return EPD_7IN3E_WHITE;
    }

    // Fallback to white if color doesn't match exactly
    return EPD_7IN3E_WHITE;
}

// Check if module is initialized
int epd_is_initialized(void) {
    return is_initialized;
}

// Get version info
const char* epd_get_version(void) {
    return "EPD 7in3e FFI v1.0.0";
}
