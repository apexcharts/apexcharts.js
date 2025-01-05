#include <assert.h>
#include <bare.h>
#include <js.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <utf.h>
#include <uv.h>

#ifndef _MSC_VER
#include <unistd.h>
#endif

/**
 * Per-thread singleton response handler that all file system requests
 * reference.
 */
typedef struct {
  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_response;
} bare_fs_t;

typedef struct {
  uv_fs_t req;

  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_response;

  uint32_t id;

  js_ref_t *data;
} bare_fs_req_t;

typedef utf8_t bare_fs_path_t[4096 + 1 /* NULL */];

typedef struct {
  uv_dir_t *dir;
} bare_fs_dir_t;

typedef struct {
  uv_fs_event_t handle;

  js_env_t *env;
  js_ref_t *ctx;
  js_ref_t *on_event;
  js_ref_t *on_close;
} bare_fs_watcher_t;

typedef uv_dirent_t bare_fs_dirent_t;

static inline void
bare_fs__on_response (uv_fs_t *uv_req) {
  int err;

  bare_fs_req_t *req = (bare_fs_req_t *) uv_req;

  js_env_t *env = req->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, req->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_response;
  err = js_get_reference_value(env, req->on_response, &on_response);
  assert(err == 0);

  js_value_t *args[3];

  err = js_create_uint32(env, req->id, &args[0]);
  assert(err == 0);

  if (uv_req->result < 0) {
    js_value_t *code;
    err = js_create_string_utf8(env, (utf8_t *) uv_err_name(uv_req->result), -1, &code);
    assert(err == 0);

    js_value_t *message;
    err = js_create_string_utf8(env, (utf8_t *) uv_strerror(uv_req->result), -1, &message);
    assert(err == 0);

    err = js_create_error(env, code, message, &args[1]);
    assert(err == 0);
  } else {
    err = js_get_null(env, &args[1]);
    assert(err == 0);
  }

  err = js_create_int32(env, uv_req->result, &args[2]);
  assert(err == 0);

  uv_fs_req_cleanup(uv_req);

  if (req->data) {
    err = js_delete_reference(env, req->data);
    assert(err == 0);

    req->data = NULL;
  }

  js_call_function(req->env, ctx, on_response, 3, args, NULL);

  err = js_close_handle_scope(req->env, scope);
  assert(err == 0);
}

static void
bare_fs__on_stat_response (uv_fs_t *uv_req) {
  int err;

  bare_fs_req_t *req = (bare_fs_req_t *) uv_req;

  js_env_t *env = req->env;

  if (uv_req->result == 0) {
    js_handle_scope_t *scope;
    err = js_open_handle_scope(env, &scope);
    assert(err == 0);

    js_value_t *data;
    err = js_get_reference_value(env, req->data, &data);
    assert(err == 0);

    uint32_t i = 0;

#define V(property) \
  { \
    js_value_t *value; \
    err = js_create_int64(env, uv_req->statbuf.st_##property, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, data, i++, value); \
    assert(err == 0); \
  }
    V(dev)
    V(mode)
    V(nlink)
    V(uid)
    V(gid)
    V(rdev)
    V(blksize)
    V(ino)
    V(size)
    V(blocks)
#undef V

#define V(property) \
  { \
    uv_timespec_t time = uv_req->statbuf.st_##property; \
\
    js_value_t *value; \
    err = js_create_int64(env, time.tv_sec * 1e3 + time.tv_nsec / 1e6, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, data, i++, value); \
    assert(err == 0); \
  }
    V(atim)
    V(mtim)
    V(ctim)
    V(birthtim)
#undef V

    err = js_close_handle_scope(req->env, scope);
    assert(err == 0);
  }

  bare_fs__on_response(uv_req);
}

static void
bare_fs__on_realpath_response (uv_fs_t *uv_req) {
  int err;

  bare_fs_req_t *req = (bare_fs_req_t *) uv_req;

  js_env_t *env = req->env;

  if (uv_req->result == 0) {
    js_handle_scope_t *scope;
    err = js_open_handle_scope(env, &scope);
    assert(err == 0);

    js_value_t *data;
    err = js_get_reference_value(env, req->data, &data);
    assert(err == 0);

    char *path;
    err = js_get_typedarray_info(env, data, NULL, (void **) &path, NULL, NULL, NULL);
    assert(err == 0);

    strncpy(path, uv_req->ptr, sizeof(bare_fs_path_t));

    err = js_close_handle_scope(req->env, scope);
    assert(err == 0);
  }

  bare_fs__on_response(uv_req);
}

static void
bare_fs__on_readlink_response (uv_fs_t *uv_req) {
  int err;

  bare_fs_req_t *req = (bare_fs_req_t *) uv_req;

  js_env_t *env = req->env;

  if (uv_req->result == 0) {
    js_handle_scope_t *scope;
    err = js_open_handle_scope(env, &scope);
    assert(err == 0);

    js_value_t *data;
    err = js_get_reference_value(env, req->data, &data);
    assert(err == 0);

    char *path;
    err = js_get_typedarray_info(env, data, NULL, (void **) &path, NULL, NULL, NULL);
    assert(err == 0);

    strncpy(path, uv_req->ptr, sizeof(bare_fs_path_t));

    err = js_close_handle_scope(req->env, scope);
    assert(err == 0);
  }

  bare_fs__on_response(uv_req);
}

static void
bare_fs__on_opendir_response (uv_fs_t *uv_req) {
  int err;

  bare_fs_req_t *req = (bare_fs_req_t *) uv_req;

  js_env_t *env = req->env;

  if (uv_req->result == 0) {
    js_handle_scope_t *scope;
    err = js_open_handle_scope(env, &scope);
    assert(err == 0);

    js_value_t *data;
    err = js_get_reference_value(env, req->data, &data);
    assert(err == 0);

    bare_fs_dir_t *dir;
    err = js_get_typedarray_info(env, data, NULL, (void **) &dir, NULL, NULL, NULL);
    assert(err == 0);

    dir->dir = uv_req->ptr;

    err = js_close_handle_scope(req->env, scope);
    assert(err == 0);
  }

  bare_fs__on_response(uv_req);
}

static void
bare_fs__on_readdir_response (uv_fs_t *uv_req) {
  int err;

  bare_fs_req_t *req = (bare_fs_req_t *) uv_req;

  js_env_t *env = req->env;

  if (uv_req->result > 0) {
    js_handle_scope_t *scope;
    err = js_open_handle_scope(env, &scope);
    assert(err == 0);

    js_value_t *data;
    err = js_get_reference_value(env, req->data, &data);
    assert(err == 0);

    uv_dir_t *dir = uv_req->ptr;

    for (size_t i = 0, n = uv_req->result; i < n; i++) {
      uv_dirent_t *dirent = &dir->dirents[i];

      js_value_t *entry;
      err = js_create_object(env, &entry);
      assert(err == 0);

      err = js_set_element(env, data, i, entry);
      assert(err == 0);

      size_t name_len = strlen(dirent->name);

      js_value_t *name;
      void *data;
      err = js_create_arraybuffer(env, name_len, &data, &name);
      assert(err == 0);

      memcpy(data, dirent->name, name_len);

      err = js_set_named_property(env, entry, "name", name);
      assert(err == 0);

      js_value_t *type;
      err = js_create_uint32(env, dirent->type, &type);
      assert(err == 0);

      err = js_set_named_property(env, entry, "type", type);
      assert(err == 0);
    }

    err = js_close_handle_scope(req->env, scope);
    assert(err == 0);
  }

  bare_fs__on_response(uv_req);
}

static void
bare_fs__on_watcher_event (uv_fs_event_t *handle, const char *filename, int events, int status) {
  int err;

  bare_fs_watcher_t *watcher = (bare_fs_watcher_t *) handle;

  js_env_t *env = watcher->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, watcher->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_event;
  err = js_get_reference_value(env, watcher->on_event, &on_event);
  assert(err == 0);

  js_value_t *args[3];

  if (status < 0) {
    js_value_t *code;
    err = js_create_string_utf8(env, (utf8_t *) uv_err_name(status), -1, &code);
    assert(err == 0);

    js_value_t *message;
    err = js_create_string_utf8(env, (utf8_t *) uv_strerror(status), -1, &message);
    assert(err == 0);

    err = js_create_error(env, code, message, &args[0]);
    assert(err == 0);

    err = js_create_int32(env, 0, &args[1]);
    assert(err == 0);

    err = js_get_null(env, &args[2]);
    assert(err == 0);
  } else {
    err = js_get_null(env, &args[0]);
    assert(err == 0);

    err = js_create_int32(env, events, &args[1]);
    assert(err == 0);

    size_t len = strlen(filename);

    void *data;
    err = js_create_arraybuffer(env, len, &data, &args[2]);
    assert(err == 0);

    memcpy(data, (void *) filename, len);
  }

  js_call_function(env, ctx, on_event, 3, args, NULL);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static void
bare_fs__on_watcher_close (uv_handle_t *handle) {
  int err;

  bare_fs_watcher_t *watcher = (bare_fs_watcher_t *) handle;

  js_env_t *env = watcher->env;

  js_handle_scope_t *scope;
  err = js_open_handle_scope(env, &scope);
  assert(err == 0);

  js_value_t *ctx;
  err = js_get_reference_value(env, watcher->ctx, &ctx);
  assert(err == 0);

  js_value_t *on_close;
  err = js_get_reference_value(env, watcher->on_close, &on_close);
  assert(err == 0);

  js_call_function(env, ctx, on_close, 0, NULL, NULL);

  err = js_delete_reference(env, watcher->on_event);
  assert(err == 0);

  err = js_delete_reference(env, watcher->on_close);
  assert(err == 0);

  err = js_delete_reference(env, watcher->ctx);
  assert(err == 0);

  err = js_close_handle_scope(env, scope);
  assert(err == 0);
}

static js_value_t *
bare_fs_init (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_t *fs;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &fs, NULL, NULL, NULL);
  assert(err == 0);

  fs->env = env;

  err = js_create_reference(env, argv[1], 1, &fs->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &fs->on_response);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_fs_destroy (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_t *fs;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &fs, NULL, NULL, NULL);
  assert(err == 0);

  err = js_delete_reference(env, fs->on_response);
  assert(err == 0);

  err = js_delete_reference(env, fs->ctx);
  assert(err == 0);

  return NULL;
}

static js_value_t *
bare_fs_req_init (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_t *fs;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &fs, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  // Copy the singleton response handler to the request.
  req->env = fs->env;
  req->ctx = fs->ctx;
  req->on_response = fs->on_response;

  return NULL;
}

static js_value_t *
bare_fs_open (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t flags;
  err = js_get_value_int32(env, argv[2], &flags);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[3], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_open(loop, (uv_fs_t *) req, (char *) path, flags, mode, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_open_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t flags;
  err = js_get_value_int32(env, argv[1], &flags);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[2], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_open(loop, &req, (char *) path, flags, mode, NULL);

  js_value_t *res = NULL;

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    err = js_create_int32(env, req.result, &res);
    assert(err == 0);
  }

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_close (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_close(loop, (uv_fs_t *) req, fd, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_close_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[0], &fd);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_close(loop, &req, fd, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_access (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[2], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_access(loop, (uv_fs_t *) req, (char *) path, mode, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_access_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[1], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_access(loop, &req, (char *) path, mode, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_read (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 6;
  js_value_t *argv[6];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 6);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  uint8_t *data;
  size_t data_len;
  err = js_get_typedarray_info(env, argv[2], NULL, (void **) &data, &data_len, NULL, NULL);
  assert(err == 0);

  uint32_t offset;
  err = js_get_value_uint32(env, argv[3], &offset);
  assert(err == 0);

  uint32_t len;
  err = js_get_value_uint32(env, argv[4], &len);
  assert(err == 0);

  if (offset >= data_len) len = 0;
  else if (offset + len >= data_len) len = data_len - offset;

  int64_t pos;
  err = js_get_value_int64(env, argv[5], &pos);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_buf_t buf = uv_buf_init((void *) (data + offset), len);

  uv_fs_read(loop, (uv_fs_t *) req, fd, &buf, 1, pos, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_read_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 5;
  js_value_t *argv[5];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 5);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[0], &fd);
  assert(err == 0);

  uint8_t *data;
  size_t data_len;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &data, &data_len, NULL, NULL);
  assert(err == 0);

  uint32_t offset;
  err = js_get_value_uint32(env, argv[2], &offset);
  assert(err == 0);

  uint32_t len;
  err = js_get_value_uint32(env, argv[3], &len);
  assert(err == 0);

  if (offset >= data_len) len = 0;
  else if (offset + len >= data_len) len = data_len - offset;

  int64_t pos;
  err = js_get_value_int64(env, argv[4], &pos);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_buf_t buf = uv_buf_init((void *) (data + offset), len);

  uv_fs_t req;
  uv_fs_read(loop, (uv_fs_t *) &req, fd, &buf, 1, pos, NULL);

  js_value_t *res;
  err = js_create_int32(env, req.result, &res);
  assert(err == 0);

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_readv (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  js_value_t *arr = argv[2];
  js_value_t *item;

  int64_t pos;
  err = js_get_value_int64(env, argv[3], &pos);
  assert(err == 0);

  err = js_create_reference(env, arr, 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uint32_t bufs_len;
  err = js_get_array_length(env, arr, &bufs_len);
  assert(err == 0);

  uv_buf_t *bufs = malloc(sizeof(uv_buf_t) * bufs_len);

  for (uint32_t i = 0; i < bufs_len; i++) {
    err = js_get_element(env, arr, i, &item);
    assert(err == 0);

    uv_buf_t *buf = &bufs[i];
    err = js_get_typedarray_info(env, item, NULL, (void **) &buf->base, (size_t *) &buf->len, NULL, NULL);
    assert(err == 0);
  }

  uv_fs_read(loop, (uv_fs_t *) req, fd, bufs, bufs_len, pos, bare_fs__on_response);

  free(bufs);

  return NULL;
}

static js_value_t *
bare_fs_write (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 6;
  js_value_t *argv[6];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 6);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  uint8_t *data;
  size_t data_len;
  err = js_get_typedarray_info(env, argv[2], NULL, (void **) &data, &data_len, NULL, NULL);
  assert(err == 0);

  uint32_t offset;
  err = js_get_value_uint32(env, argv[3], &offset);
  assert(err == 0);

  uint32_t len;
  err = js_get_value_uint32(env, argv[4], &len);
  assert(err == 0);

  if (offset >= data_len) len = 0;
  else if (offset + len >= data_len) len = data_len - offset;

  int64_t pos;
  err = js_get_value_int64(env, argv[5], &pos);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_buf_t buf = uv_buf_init((void *) (data + offset), len);

  uv_fs_write(loop, (uv_fs_t *) req, fd, &buf, 1, pos, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_write_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 5;
  js_value_t *argv[5];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 5);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[0], &fd);
  assert(err == 0);

  uint8_t *data;
  size_t data_len;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &data, &data_len, NULL, NULL);
  assert(err == 0);

  uint32_t offset;
  err = js_get_value_uint32(env, argv[2], &offset);
  assert(err == 0);

  uint32_t len;
  err = js_get_value_uint32(env, argv[3], &len);
  assert(err == 0);

  if (offset >= data_len) len = 0;
  else if (offset + len >= data_len) len = data_len - offset;

  int64_t pos;
  err = js_get_value_int64(env, argv[4], &pos);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_buf_t buf = uv_buf_init((void *) (data + offset), len);

  uv_fs_t req;
  uv_fs_write(loop, &req, fd, &buf, 1, pos, NULL);

  js_value_t *res;
  err = js_create_int32(env, req.result, &res);
  assert(err == 0);

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_writev (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  js_value_t *arr = argv[2];
  js_value_t *item;

  int64_t pos;
  err = js_get_value_int64(env, argv[3], &pos);
  assert(err == 0);

  err = js_create_reference(env, arr, 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uint32_t bufs_len;
  err = js_get_array_length(env, arr, &bufs_len);
  assert(err == 0);

  uv_buf_t *bufs = malloc(sizeof(uv_buf_t) * bufs_len);

  for (uint32_t i = 0; i < bufs_len; i++) {
    err = js_get_element(env, arr, i, &item);
    assert(err == 0);

    uv_buf_t *buf = &bufs[i];
    err = js_get_typedarray_info(env, item, NULL, (void **) &buf->base, (size_t *) &buf->len, NULL, NULL);
    assert(err == 0);
  }

  uv_fs_write(loop, (uv_fs_t *) req, fd, bufs, bufs_len, pos, bare_fs__on_response);

  free(bufs);

  return NULL;
}

static js_value_t *
bare_fs_ftruncate (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  int64_t len;
  err = js_get_value_int64(env, argv[2], &len);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_ftruncate(loop, (uv_fs_t *) req, fd, len, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_chmod (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[2], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_chmod(loop, (uv_fs_t *) req, (char *) path, mode, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_chmod_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[1], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_chmod(loop, &req, (char *) path, mode, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_fchmod (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[2], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_fchmod(loop, (uv_fs_t *) req, fd, mode, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_fchmod_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[0], &fd);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[1], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_fchmod(loop, &req, fd, mode, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_rename (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t src;
  err = js_get_value_string_utf8(env, argv[1], src, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  bare_fs_path_t dest;
  err = js_get_value_string_utf8(env, argv[2], dest, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_rename(loop, (uv_fs_t *) req, (char *) src, (char *) dest, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_rename_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t src;
  err = js_get_value_string_utf8(env, argv[0], src, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  bare_fs_path_t dest;
  err = js_get_value_string_utf8(env, argv[1], dest, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_rename(loop, &req, (char *) src, (char *) dest, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_mkdir (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[2], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_mkdir(loop, (uv_fs_t *) req, (char *) path, mode, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_mkdir_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t mode;
  err = js_get_value_int32(env, argv[1], &mode);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_mkdir(loop, &req, (char *) path, mode, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_rmdir (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_rmdir(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_rmdir_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_rmdir(loop, &req, (char *) path, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_stat (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_stat(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_stat_response);

  return NULL;
}

static js_value_t *
bare_fs_stat_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_stat(loop, &req, (char *) path, NULL);

  js_value_t *res = NULL;

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    err = js_create_array_with_length(env, 14, &res);
    assert(err == 0);

    uint32_t i = 0;

#define V(property) \
  { \
    js_value_t *value; \
    err = js_create_int64(env, req.statbuf.st_##property, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, res, i++, value); \
    assert(err == 0); \
  }
    V(dev)
    V(mode)
    V(nlink)
    V(uid)
    V(gid)
    V(rdev)
    V(blksize)
    V(ino)
    V(size)
    V(blocks)
#undef V

#define V(property) \
  { \
    uv_timespec_t time = req.statbuf.st_##property; \
\
    js_value_t *value; \
    err = js_create_int64(env, time.tv_sec * 1e3 + time.tv_nsec / 1e6, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, res, i++, value); \
    assert(err == 0); \
  }
    V(atim)
    V(mtim)
    V(ctim)
    V(birthtim)
#undef V
  }

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_lstat (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_lstat(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_stat_response);

  return NULL;
}

static js_value_t *
bare_fs_lstat_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_lstat(loop, &req, (char *) path, NULL);

  js_value_t *res = NULL;

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    err = js_create_array_with_length(env, 14, &res);
    assert(err == 0);

    uint32_t i = 0;

#define V(property) \
  { \
    js_value_t *value; \
    err = js_create_int64(env, req.statbuf.st_##property, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, res, i++, value); \
    assert(err == 0); \
  }
    V(dev)
    V(mode)
    V(nlink)
    V(uid)
    V(gid)
    V(rdev)
    V(blksize)
    V(ino)
    V(size)
    V(blocks)
#undef V

#define V(property) \
  { \
    uv_timespec_t time = req.statbuf.st_##property; \
\
    js_value_t *value; \
    err = js_create_int64(env, time.tv_sec * 1e3 + time.tv_nsec / 1e6, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, res, i++, value); \
    assert(err == 0); \
  }
    V(atim)
    V(mtim)
    V(ctim)
    V(birthtim)
#undef V
  }

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_fstat (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[1], &fd);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_fstat(loop, (uv_fs_t *) req, fd, bare_fs__on_stat_response);

  return NULL;
}

static js_value_t *
bare_fs_fstat_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  uint32_t fd;
  err = js_get_value_uint32(env, argv[0], &fd);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_fstat(loop, &req, fd, NULL);

  js_value_t *res = NULL;

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    err = js_create_array_with_length(env, 14, &res);
    assert(err == 0);

    uint32_t i = 0;

#define V(property) \
  { \
    js_value_t *value; \
    err = js_create_int64(env, req.statbuf.st_##property, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, res, i++, value); \
    assert(err == 0); \
  }
    V(dev)
    V(mode)
    V(nlink)
    V(uid)
    V(gid)
    V(rdev)
    V(blksize)
    V(ino)
    V(size)
    V(blocks)
#undef V

#define V(property) \
  { \
    uv_timespec_t time = req.statbuf.st_##property; \
\
    js_value_t *value; \
    err = js_create_int64(env, time.tv_sec * 1e3 + time.tv_nsec / 1e6, &value); \
    assert(err == 0); \
\
    err = js_set_element(env, res, i++, value); \
    assert(err == 0); \
  }
    V(atim)
    V(mtim)
    V(ctim)
    V(birthtim)
#undef V
  }

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_unlink (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_unlink(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_unlink_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_unlink(loop, &req, (char *) path, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_realpath (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_realpath(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_realpath_response);

  return NULL;
}

static js_value_t *
bare_fs_realpath_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_realpath(loop, &req, (char *) path, NULL);

  js_value_t *res = NULL;

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    char *path;
    err = js_get_typedarray_info(env, argv[1], NULL, (void **) &path, NULL, NULL, NULL);
    assert(err == 0);

    strncpy(path, req.ptr, sizeof(bare_fs_path_t));
  }

  uv_fs_req_cleanup(&req);

  return res;
}

static js_value_t *
bare_fs_readlink (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_readlink(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_readlink_response);

  return NULL;
}

static js_value_t *
bare_fs_readlink_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_readlink(loop, &req, (char *) path, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    char *path;
    err = js_get_typedarray_info(env, argv[1], NULL, (void **) &path, NULL, NULL, NULL);
    assert(err == 0);

    strncpy(path, req.ptr, sizeof(bare_fs_path_t));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_symlink (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t target;
  err = js_get_value_string_utf8(env, argv[1], target, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[2], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t flags;
  err = js_get_value_int32(env, argv[3], &flags);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_symlink(loop, (uv_fs_t *) req, (char *) target, (char *) path, flags, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_symlink_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_path_t target;
  err = js_get_value_string_utf8(env, argv[0], target, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  int32_t flags;
  err = js_get_value_int32(env, argv[2], &flags);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_symlink(loop, &req, (char *) target, (char *) path, flags, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_opendir (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[1], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  err = js_create_reference(env, argv[2], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_opendir(loop, (uv_fs_t *) req, (char *) path, bare_fs__on_opendir_response);

  return NULL;
}

static js_value_t *
bare_fs_opendir_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  js_value_t *data = argv[1];

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_opendir(loop, &req, (char *) path, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    bare_fs_dir_t *dir;
    err = js_get_typedarray_info(env, argv[1], NULL, (void **) &dir, NULL, NULL, NULL);
    assert(err == 0);

    dir->dir = req.ptr;
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_readdir (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 4;
  js_value_t *argv[4];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 4);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_dir_t *dir;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &dir, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_dirent_t *dirents;
  size_t dirents_len;
  err = js_get_typedarray_info(env, argv[2], NULL, (void **) &dirents, &dirents_len, NULL, NULL);
  assert(err == 0);

  err = js_create_reference(env, argv[3], 1, &req->data);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  dir->dir->dirents = dirents;
  dir->dir->nentries = dirents_len / sizeof(bare_fs_dirent_t);

  uv_fs_readdir(loop, (uv_fs_t *) req, dir->dir, bare_fs__on_readdir_response);

  return NULL;
}

static js_value_t *
bare_fs_readdir_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 3;
  js_value_t *argv[3];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 3);

  bare_fs_dir_t *dir;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &dir, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_dirent_t *dirents;
  size_t dirents_len;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &dirents, &dirents_len, NULL, NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  dir->dir->dirents = dirents;
  dir->dir->nentries = dirents_len / sizeof(bare_fs_dirent_t);

  uv_fs_t req;
  uv_fs_readdir(loop, &req, dir->dir, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  } else {
    uv_dir_t *dir = req.ptr;

    for (size_t i = 0, n = req.result; i < n; i++) {
      uv_dirent_t *dirent = &dir->dirents[i];

      js_value_t *entry;
      err = js_create_object(env, &entry);
      assert(err == 0);

      err = js_set_element(env, argv[2], i, entry);
      assert(err == 0);

      size_t name_len = strlen(dirent->name);

      js_value_t *name;
      void *data;
      err = js_create_arraybuffer(env, name_len, &data, &name);
      assert(err == 0);

      memcpy(data, dirent->name, name_len);

      err = js_set_named_property(env, entry, "name", name);
      assert(err == 0);

      js_value_t *type;
      err = js_create_uint32(env, dirent->type, &type);
      assert(err == 0);

      err = js_set_named_property(env, entry, "type", type);
      assert(err == 0);
    }
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_closedir (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 2;
  js_value_t *argv[2];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 2);

  bare_fs_req_t *req;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &req, NULL, NULL, NULL);
  assert(err == 0);

  bare_fs_dir_t *dir;
  err = js_get_typedarray_info(env, argv[1], NULL, (void **) &dir, NULL, NULL, NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_closedir(loop, (uv_fs_t *) req, dir->dir, bare_fs__on_response);

  return NULL;
}

static js_value_t *
bare_fs_closedir_sync (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_dir_t *dir;
  err = js_get_typedarray_info(env, argv[0], NULL, (void **) &dir, NULL, NULL, NULL);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  uv_fs_t req;
  uv_fs_closedir(loop, &req, dir->dir, NULL);

  if (req.result < 0) {
    js_throw_error(env, uv_err_name(req.result), uv_strerror(req.result));
  }

  uv_fs_req_cleanup(&req);

  return NULL;
}

static js_value_t *
bare_fs_watcher_init (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 5;
  js_value_t *argv[5];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 5);

  bare_fs_path_t path;
  err = js_get_value_string_utf8(env, argv[0], path, sizeof(bare_fs_path_t), NULL);
  assert(err == 0);

  bool recursive;
  err = js_get_value_bool(env, argv[1], &recursive);
  assert(err == 0);

  js_value_t *result;

  bare_fs_watcher_t *watcher;
  err = js_create_arraybuffer(env, sizeof(bare_fs_watcher_t), (void **) &watcher, &result);
  assert(err == 0);

  uv_loop_t *loop;
  js_get_env_loop(env, &loop);

  err = uv_fs_event_init(loop, &watcher->handle);

  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));

    return NULL;
  }

  err = uv_fs_event_start(&watcher->handle, bare_fs__on_watcher_event, (char *) path, recursive ? UV_FS_EVENT_RECURSIVE : 0);

  if (err < 0) {
    js_throw_error(env, uv_err_name(err), uv_strerror(err));

    return NULL;
  }

  watcher->env = env;

  err = js_create_reference(env, argv[2], 1, &watcher->ctx);
  assert(err == 0);

  err = js_create_reference(env, argv[3], 1, &watcher->on_event);
  assert(err == 0);

  err = js_create_reference(env, argv[4], 1, &watcher->on_close);
  assert(err == 0);

  return result;
}

static js_value_t *
bare_fs_watcher_close (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_watcher_t *watcher;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &watcher, NULL);
  assert(err == 0);

  err = uv_fs_event_stop(&watcher->handle);
  assert(err == 0);

  uv_close((uv_handle_t *) &watcher->handle, bare_fs__on_watcher_close);

  return NULL;
}

static js_value_t *
bare_fs_watcher_ref (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_watcher_t *watcher;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &watcher, NULL);
  assert(err == 0);

  uv_ref((uv_handle_t *) &watcher->handle);

  return NULL;
}

static js_value_t *
bare_fs_watcher_unref (js_env_t *env, js_callback_info_t *info) {
  int err;

  size_t argc = 1;
  js_value_t *argv[1];

  err = js_get_callback_info(env, info, &argc, argv, NULL, NULL);
  assert(err == 0);

  assert(argc == 1);

  bare_fs_watcher_t *watcher;
  err = js_get_arraybuffer_info(env, argv[0], (void **) &watcher, NULL);
  assert(err == 0);

  uv_unref((uv_handle_t *) &watcher->handle);

  return NULL;
}

static js_value_t *
bare_fs_exports (js_env_t *env, js_value_t *exports) {
  int err;

  {
    js_value_t *val;
    js_create_uint32(env, sizeof(bare_fs_t), &val);
    js_set_named_property(env, exports, "sizeofFS", val);
  }
  {
    js_value_t *val;
    js_create_uint32(env, sizeof(bare_fs_req_t), &val);
    js_set_named_property(env, exports, "sizeofFSReq", val);
  }
  {
    js_value_t *val;
    js_create_uint32(env, offsetof(bare_fs_req_t, id), &val);
    js_set_named_property(env, exports, "offsetofFSReqID", val);
  }
  {
    js_value_t *val;
    js_create_uint32(env, sizeof(bare_fs_dir_t), &val);
    js_set_named_property(env, exports, "sizeofFSDir", val);
  }
  {
    js_value_t *val;
    js_create_uint32(env, sizeof(bare_fs_dirent_t), &val);
    js_set_named_property(env, exports, "sizeofFSDirent", val);
  }
  {
    js_value_t *val;
    js_create_uint32(env, sizeof(bare_fs_path_t), &val);
    js_set_named_property(env, exports, "sizeofFSPath", val);
  }

#define V(name, fn) \
  { \
    js_value_t *val; \
    err = js_create_function(env, name, -1, fn, NULL, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, name, val); \
    assert(err == 0); \
  }

  V("init", bare_fs_init)
  V("destroy", bare_fs_destroy)
  V("initReq", bare_fs_req_init)
  V("open", bare_fs_open)
  V("openSync", bare_fs_open_sync)
  V("close", bare_fs_close)
  V("closeSync", bare_fs_close_sync)
  V("access", bare_fs_access)
  V("accessSync", bare_fs_access_sync)
  V("read", bare_fs_read)
  V("readSync", bare_fs_read_sync)
  V("readv", bare_fs_readv)
  V("write", bare_fs_write)
  V("writeSync", bare_fs_write_sync)
  V("writev", bare_fs_writev)
  V("ftruncate", bare_fs_ftruncate)
  V("chmod", bare_fs_chmod)
  V("chmodSync", bare_fs_chmod_sync)
  V("fchmod", bare_fs_fchmod)
  V("fchmodSync", bare_fs_fchmod_sync)
  V("rename", bare_fs_rename)
  V("renameSync", bare_fs_rename_sync)
  V("mkdir", bare_fs_mkdir)
  V("mkdirSync", bare_fs_mkdir_sync)
  V("rmdir", bare_fs_rmdir)
  V("rmdirSync", bare_fs_rmdir_sync)
  V("stat", bare_fs_stat)
  V("statSync", bare_fs_stat_sync)
  V("lstat", bare_fs_lstat)
  V("lstatSync", bare_fs_lstat_sync)
  V("fstat", bare_fs_fstat)
  V("fstatSync", bare_fs_fstat_sync)
  V("unlink", bare_fs_unlink)
  V("unlinkSync", bare_fs_unlink_sync)
  V("realpath", bare_fs_realpath)
  V("realpathSync", bare_fs_realpath_sync)
  V("readlink", bare_fs_readlink)
  V("readlinkSync", bare_fs_readlink_sync)
  V("symlink", bare_fs_symlink)
  V("symlinkSync", bare_fs_symlink_sync)
  V("opendir", bare_fs_opendir)
  V("opendirSync", bare_fs_opendir_sync)
  V("readdir", bare_fs_readdir)
  V("readdirSync", bare_fs_readdir_sync)
  V("closedir", bare_fs_closedir)
  V("closedirSync", bare_fs_closedir_sync)
  V("watcherInit", bare_fs_watcher_init)
  V("watcherClose", bare_fs_watcher_close)
  V("watcherRef", bare_fs_watcher_ref)
  V("watcherUnref", bare_fs_watcher_unref)
#undef V

#define V(name) \
  { \
    js_value_t *val; \
    err = js_create_uint32(env, name, &val); \
    assert(err == 0); \
    err = js_set_named_property(env, exports, #name, val); \
    assert(err == 0); \
  }

  V(O_RDWR)
  V(O_RDONLY)
  V(O_WRONLY)
  V(O_CREAT)
  V(O_TRUNC)
  V(O_APPEND)

#ifdef F_OK
  V(F_OK)
#endif
#ifdef R_OK
  V(R_OK)
#endif
#ifdef W_OK
  V(W_OK)
#endif
#ifdef X_OK
  V(X_OK)
#endif

  V(S_IFMT)
  V(S_IFREG)
  V(S_IFDIR)
  V(S_IFCHR)
  V(S_IFLNK)
#ifdef S_IFBLK
  V(S_IFBLK)
#endif
#ifdef S_IFIFO
  V(S_IFIFO)
#endif
#ifdef S_IFSOCK
  V(S_IFSOCK)
#endif

#ifdef S_IRUSR
  V(S_IRUSR)
#endif
#ifdef S_IWUSR
  V(S_IWUSR)
#endif
#ifdef S_IXUSR
  V(S_IXUSR)
#endif
#ifdef S_IRGRP
  V(S_IRGRP)
#endif
#ifdef S_IWGRP
  V(S_IWGRP)
#endif
#ifdef S_IXGRP
  V(S_IXGRP)
#endif
#ifdef S_IROTH
  V(S_IROTH)
#endif
#ifdef S_IWOTH
  V(S_IWOTH)
#endif
#ifdef S_IXOTH
  V(S_IXOTH)
#endif

  V(UV_DIRENT_UNKNOWN)
  V(UV_DIRENT_FILE)
  V(UV_DIRENT_DIR)
  V(UV_DIRENT_LINK)
  V(UV_DIRENT_FIFO)
  V(UV_DIRENT_SOCKET)
  V(UV_DIRENT_CHAR)
  V(UV_DIRENT_BLOCK)

  V(UV_FS_SYMLINK_DIR)
  V(UV_FS_SYMLINK_JUNCTION)

  V(UV_RENAME)
  V(UV_CHANGE)
#undef V

  return exports;
}

BARE_MODULE(bare_fs, bare_fs_exports)
