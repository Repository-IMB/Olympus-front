import { Modal, Button } from "antd";
import styles from "./ModalQrActivo.module.css";

interface Props {
  visible: boolean;
  qrUrl: string | null;
  onClose: () => void;
}

export default function ModalQrActivo({
  visible,
  qrUrl,
  onClose,
}: Props) {
  const imprimir = () => {
    const ventana = window.open("", "_blank");
    if (!ventana || !qrUrl) return;

    ventana.document.write(`
      <html>
        <head>
          <title>QR Activo</title>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            img {
              width: 300px;
            }
          </style>
        </head>
        <body>
          <img src="${qrUrl}" />
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  };

  return (
    <Modal
      open={visible}
      footer={null}
      onCancel={onClose}
      title="Código QR del activo"
      centered
    >
      {qrUrl && (
        <div className={styles.container}>
          <img
            src={qrUrl}
            alt="QR Activo"
            className={styles.qr}
          />

          <div className={styles.actions}>
            <Button type="primary" onClick={imprimir}>
              Imprimir
            </Button>

            <Button
              href={qrUrl}
              download
            >
              Descargar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
