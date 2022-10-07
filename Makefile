# SPDX-License-Identifier: GPL-2.0+
# Copyright (c) 2021 Joël Porquet-Lupine and Garrett Hagopian

# Define `all` rule right away
all: build-book


###
# Configuration

# Binaries
PANDOC ?= pandoc
FILTER = pandoc/pandoc-lupbook.py

abs_filter = $(realpath $(FILTER))

# Source paths
SRC_DIR ?= sample
SRC_LBVM ?= lupbookvm.js
CONF ?= $(SRC_DIR)/config.mk

abs_conf := $(realpath $(CONF))
include $(abs_conf)

# Build paths
BUILD_DIR ?= build
BUILD_NAME ?= book.html

abs_build = $(realpath $(BUILD_DIR))

###
# Rules

build-dir: FORCE
	@mkdir -p $(BUILD_DIR)
	rm -f $(BUILD_DIR)/header-include.html

$(BUILD_DIR)/header-include.html: FORCE

build-book: build-dir $(MODULE_DEPS)
	cp $(SRC_LBVM) $(abs_build)/lupbookvm.js
	cd $(SRC_DIR) && \
        $(PANDOC) -o $(abs_build)/$(BUILD_NAME) --self-contained \
            --template template.html *.md --filter $(abs_filter)

# External Resources

ext/codemirror/lib/codemirror.js: build-codemirror
ext/codemirror/lib/codemirror.css: build-codemirror
build-codemirror:
	cd ext/codemirror && npm install

ext/xtermjs/lib/xterm.js: build-xtermjs
build-xtermjs:
	cd ext/xtermjs && npm install && npm run package

# Clean
clean: FORCE
	rm -rf $(BUILD_DIR)

# Phony rules
FORCE:
.PHONY: FORCE
