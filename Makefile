# SPDX-License-Identifier: GPL-2.0+
# Copyright (c) 2021 Joël Porquet-Lupine and Garrett Hagopian

# Define `all` rule right away
all: build-book


###
# Configuration

# Lupbook directory
abs_lbdir := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

# Binaries
PANDOC ?= pandoc
FILTERS = pandoc/lupbook.py pandoc/toc_filter.py

abs_filters = $(realpath $(FILTERS))

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

$(abs_build)/lupbookvm.js: $(SRC_LBVM)
	cp $(SRC_LBVM) $(abs_build)/lupbookvm.js

build-book: build-dir $(abs_build)/lupbookvm.js
	cd $(SRC_DIR) && \
        $(PANDOC) -o $(abs_build)/$(BUILD_NAME) \
            -V lbdir=$(abs_lbdir) \
            --embed-resources --standalone \
            --section-divs \
            --template template.html *.md \
            $(patsubst %,--filter %,$(abs_filters))

# Clean
clean: FORCE
	rm -rf $(BUILD_DIR)

# Phony rules
FORCE:
.PHONY: FORCE
