{
  "targets": [
    {
      "target_name": "epd_addon",
      "sources": [
        "src/native/addon.cpp",
        "src/native/EPD_7in3e.c",
        "src/native/DEV_Config.c",
        "src/native/RPI_gpiod.c",
        "src/native/dev_hardware_SPI.c",
        "src/native/sysfs_gpio.c",
        "src/native/sysfs_software_spi.c"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src/native"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "RPI",
        "USE_DEV_LIB"
      ],
      "conditions": [
        ["OS=='linux'", {
          "libraries": [
            "-lgpiod"
          ],
          "cflags": [
            "-std=c99",
            "-Wall",
            "-Wextra"
          ],
          "cflags_cc": [
            "-std=c++14",
            "-Wall",
            "-Wextra"
          ]
        }]
      ]
    }
  ]
}