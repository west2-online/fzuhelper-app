package com.west2online.umeng;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.net.Uri;
import android.util.Log;

import com.umeng.message.UmengNotifyClick;
import com.umeng.message.entity.UMessage;

import java.util.Map;

public class MfrMessageActivity extends Activity {

  private final UmengNotifyClick mNotificationClick = new UmengNotifyClick() {
    @Override
    public void onMessage(UMessage msg) {
      Log.i("UMLog", "msg from background:" + msg);
      String deeplink = msg.extra.get("deeplink");
      if (deeplink == null || deeplink.isEmpty()) {
          deeplink = "/";
      }
      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.setData(Uri.parse(deeplink));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
              | Intent.FLAG_ACTIVITY_CLEAR_TOP
              | Intent.FLAG_ACTIVITY_SINGLE_TOP);

      startActivity(intent);
    }
  };

  @Override
  protected void onCreate(Bundle bundle) {
    super.onCreate(bundle);
    mNotificationClick.onCreate(this, getIntent());
    finish();
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    mNotificationClick.onNewIntent(intent);
  }
}
