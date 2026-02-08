package com.helper.west2ol.fzuhelper

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.net.toUri
import androidx.fragment.app.Fragment

class MiPermissionFragment : Fragment() {

    private var requestCode: Int = -1

    @SuppressLint("NewApi")
    private val settingsLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
            val activity = requireActivity()

            if (checkMiShortcutPermission(activity)) {
                if (requestCode in arrayOf(REQUEST_NEXT_CLASS, REQUEST_COURSE_TABLE)) {
                    addAppWidget(activity, requestCode)
                }
            }

            parentFragmentManager.beginTransaction().remove(this).commit()
        }

    companion object {
        private const val ARG_REQUEST_CODE = "request_code"

        fun newInstance(requestCode: Int): MiPermissionFragment {
            val fragment = MiPermissionFragment()
            val args = Bundle()
            args.putInt(ARG_REQUEST_CODE, requestCode)
            fragment.arguments = args
            return fragment
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            requestCode = it.getInt(ARG_REQUEST_CODE)
        }
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            .apply {
                data = ("package:" + requireContext().packageName).toUri()
            }

//        val intent = Intent("miui.intent.action.APP_PERM_EDITOR")
//        intent.putExtra("extra_pkgname", requireContext().packageName)

        settingsLauncher.launch(intent)
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // 透明fragment
        return null
    }
}
