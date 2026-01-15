import React, { useState } from "react";
import { Upload, message } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import "./CVUpload.css";

interface CVUploadProps {
  onFileChange?: (file: File | null) => void;
  title?: string;
  required?: boolean;
}

const CVUpload: React.FC<CVUploadProps> = ({
  onFileChange,
  title = "CV Documentado",
  required = false,
}) => {
  const [file, setFile] = useState<any>(null);
  const { Dragger } = Upload;

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".pdf,.doc,.docx",
    maxCount: 1,
    beforeUpload: (file) => {
      const isPDF = file.type === "application/pdf";
      const isDoc =
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isPDF && !isDoc) {
        message.error("Solo puedes subir archivos PDF o Word");
        return Upload.LIST_IGNORE;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("El archivo debe ser menor a 5MB");
        return Upload.LIST_IGNORE;
      }

      setFile(file);
      onFileChange?.(file);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFile(null);
      onFileChange?.(null);
    },
  };

  return (
    <div className="cv-upload-wrapper">
      <label className="cv-upload-label">
        {title}
        {required && <span className="cv-upload-required"> *</span>}
      </label>
      <Dragger {...uploadProps} className="cv-upload-dragger">
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Haz clic o arrastra un archivo a esta área para subirlo.
        </p>
      </Dragger>
    </div>
  );
};

export default CVUpload;
