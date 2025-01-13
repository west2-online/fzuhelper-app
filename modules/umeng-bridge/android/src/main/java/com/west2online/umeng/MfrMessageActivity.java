package com.west2online.umeng;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.umeng.message.UmengNotifyClick;
import com.umeng.message.entity.UMessage;

import java.util.Map;

public class MfrMessageActivity extends Activity {

  private final UmengNotifyClick mNotificationClick = new UmengNotifyClick() {
    @Override
    public void onMessage(UMessage msg) {
      Map<String, String> newMsg = msg.extra;
      newMsg.put("time", String.valueOf(System.currentTimeMillis()));
      getSharedPreferences("MyAppPreferences", Context.MODE_PRIVATE).edit().putString("msg", newMsg.toString())
          .apply();
    }
  };

  @Override
  protected void onCreate(Bundle bundle) {
    super.onCreate(bundle);
    mNotificationClick.onCreate(this, getIntent());
    Intent intent = new Intent(Intent.ACTION_MAIN);
    intent.setClassName(getPackageName(), getPackageName() + ".MainActivity");
    startActivity(intent);
    finish();
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    mNotificationClick.onNewIntent(intent);
  }
}
