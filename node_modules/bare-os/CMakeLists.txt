cmake_minimum_required(VERSION 3.25)

project(bare_os C)

include(bare)

add_bare_module(bare_os)

target_sources(
  ${bare_os}
  PRIVATE
    binding.c
)
