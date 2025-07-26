/*****************************************************************************
* | File        :   epd_ffi.h
* | Author      :   Framik team
* | Function    :   FFI-compatible interface for EPD 7in3e
* | Info        :   Header file for Bun FFI usage
******************************************************************************/
#ifndef __EPD_FFI_H_
#define __EPD_FFI_H_

#ifdef __cplusplus
extern "C" {
#endif

// Initialize the e-Paper module
int epd_init(void);

// Clear the display with a specified color
int epd_clear(int color);

// Display the 7-color block test pattern
int epd_show7block(void);

// Display the color test pattern
int epd_show(void);

// Display an image buffer
int epd_display(unsigned char* image_buffer, int buffer_size);

// Put the display to sleep
int epd_sleep(void);

// Exit and cleanup the module
int epd_exit(void);

// Get display width
int epd_get_width(void);

// Get display height
int epd_get_height(void);

// Get buffer size needed for display
int epd_get_buffer_size(void);

// Get color constants
int epd_get_color_black(void);
int epd_get_color_white(void);
int epd_get_color_yellow(void);
int epd_get_color_red(void);
int epd_get_color_blue(void);
int epd_get_color_green(void);

// Create a blank image buffer filled with specified color
unsigned char* epd_create_buffer(int color);

// Free a buffer created by epd_create_buffer
void epd_free_buffer(unsigned char* buffer);

// Set a pixel in the image buffer
int epd_set_pixel(unsigned char* buffer, int x, int y, int color);

// Get a pixel from the image buffer
int epd_get_pixel(unsigned char* buffer, int x, int y);

// Map RGB color to display color
int epd_map_rgb_to_display_color(int r, int g, int b);

// Check if module is initialized
int epd_is_initialized(void);

// Get version info
const char* epd_get_version(void);

#ifdef __cplusplus
}
#endif

#endif /* __EPD_FFI_H_ */
