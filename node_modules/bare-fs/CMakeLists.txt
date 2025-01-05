cmake_minimum_required(VERSION 3.25)

project(bare_fs C)

include(bare)

add_bare_module(bare_fs)

target_sources(
  ${bare_fs}
  PRIVATE
    binding.c
)
