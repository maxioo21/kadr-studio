package pl.kadr.studio;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * FakeTok na Androida: edytor działa w całości offline z plików aplikacji.
 * Pliki są serwowane pod adresem https://appassets.androidplatform.net/ (bezpieczny kontekst dla WebGL, WebAssembly i nagrywania).
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/index.html";
    private static final int REQ_FILE = 41, REQ_PERM = 42;
    private WebView web;
    private ValueCallback<Uri[]> fileCb;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.setBackgroundColor(0xFF0C0D11);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        web.addJavascriptInterface(new Saver(), "KadrAndroid");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String p = u.getPath();
                if (p == null || p.equals("/") || p.isEmpty()) p = "/index.html";
                Map<String, String> h = new HashMap<>();
                h.put("Cache-Control", "no-cache");
                h.put("Access-Control-Allow-Origin", "*");
                String mime = mime(p);
                try {
                    InputStream in = getAssets().open("www" + p);
                    return new WebResourceResponse(mime, mime.startsWith("text/") || mime.contains("json") ? "utf-8" : null, 200, "OK", h, in);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", h, new ByteArrayInputStream(new byte[0]));
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri u = Uri.parse(url);
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                ArrayList<String> mimes = new ArrayList<>();
                for (String t : params.getAcceptTypes()) for (String part : t.split(",")) { part = part.trim(); if (!part.isEmpty()) mimes.add(part); }
                if (mimes.size() == 1) i.setType(mimes.get(0));
                else { i.setType("*/*"); if (!mimes.isEmpty()) i.putExtra(Intent.EXTRA_MIME_TYPES, mimes.toArray(new String[0])); }
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try { startActivityForResult(Intent.createChooser(i, "Wybierz pliki"), REQ_FILE); }
                catch (Exception e) { fileCb.onReceiveValue(null); fileCb = null; return false; }
                return true;
            }
        });
        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl(HOME);
    }

    private static String mime(String p) {
        String e = p.substring(p.lastIndexOf('.') + 1).toLowerCase();
        switch (e) {
            case "html": return "text/html";
            case "js": case "mjs": return "text/javascript";
            case "css": return "text/css";
            case "wasm": return "application/wasm";
            case "json": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "woff2": return "font/woff2";
            case "txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && fileCb != null) {
            Uri[] out = null;
            if (res == RESULT_OK && data != null) {
                ClipData cd = data.getClipData();
                if (cd != null) { out = new Uri[cd.getItemCount()]; for (int k = 0; k < out.length; k++) out[k] = cd.getItemAt(k).getUri(); }
                else if (data.getData() != null) out = new Uri[]{ data.getData() };
            }
            fileCb.onReceiveValue(out);
            fileCb = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    /** Zapis gotowych filmów i obrazów: filmy do galerii (Movies/Kadr Studio), zdjęcia do Pictures/Kadr Studio. */
    private class Saver {
        private OutputStream out;
        private Uri uri;
        private File file;
        private String label;

        @JavascriptInterface
        public boolean begin(String name, String type) {
            close();
            String m = type == null || type.isEmpty() ? guess(name) : type;
            String dir = m.startsWith("video/") ? Environment.DIRECTORY_MOVIES : m.startsWith("image/") ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS;
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put("_display_name", name);
                    cv.put("mime_type", m);
                    cv.put("relative_path", dir + "/FakeTok");
                    cv.put("is_pending", 1);
                    Uri coll = m.startsWith("video/") ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                            : m.startsWith("image/") ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                            : Uri.parse("content://media/external/downloads");
                    uri = getContentResolver().insert(coll, cv);
                    if (uri == null) return false;
                    out = getContentResolver().openOutputStream(uri);
                } else {
                    if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                        runOnUiThread(new Runnable() { public void run() { requestPermissions(new String[]{ Manifest.permission.WRITE_EXTERNAL_STORAGE }, REQ_PERM); } });
                        return false;
                    }
                    File d = new File(Environment.getExternalStoragePublicDirectory(dir), "FakeTok");
                    if (!d.exists() && !d.mkdirs()) return false;
                    file = new File(d, name);
                    out = new FileOutputStream(file);
                }
                label = (m.startsWith("video/") ? "Galeria, folder " : "folder ") + dir + "/FakeTok";
                return out != null;
            } catch (Exception e) { close(); return false; }
        }

        @JavascriptInterface
        public boolean chunk(String b64) {
            if (out == null) return false;
            try { out.write(Base64.decode(b64, Base64.DEFAULT)); return true; } catch (Exception e) { close(); return false; }
        }

        @JavascriptInterface
        public String end() {
            try {
                if (out != null) out.close();
                out = null;
                if (uri != null && Build.VERSION.SDK_INT >= 29) { ContentValues cv = new ContentValues(); cv.put("is_pending", 0); getContentResolver().update(uri, cv, null, null); }
                if (file != null) MediaScannerConnection.scanFile(MainActivity.this, new String[]{ file.getAbsolutePath() }, null, null);
            } catch (Exception ignored) { }
            uri = null; file = null;
            return label == null ? "Pobrane" : label;
        }

        private void close() { try { if (out != null) out.close(); } catch (Exception ignored) { } out = null; }
    }

    private static String guess(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".mp4")) return "video/mp4";
        if (n.endsWith(".webm")) return "video/webm";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override
    protected void onPause() { super.onPause(); web.onPause(); }
    @Override
    protected void onResume() { super.onResume(); web.onResume(); }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(function(){var m=document.querySelector('.modal-bg');if(m){var x=m.querySelector('.modal-h .ib');if(x)x.click();else m.remove();return 'tak'}if(document.body.classList.contains('m-edit')){var t=document.querySelector('#tabs .tab');if(t)t.click();return 'tak'}return 'nie'})()", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (v != null && v.contains("tak")) return;
                finish();
            }
        });
    }

    @Override
    protected void onDestroy() { if (web != null) web.destroy(); super.onDestroy(); }
}
