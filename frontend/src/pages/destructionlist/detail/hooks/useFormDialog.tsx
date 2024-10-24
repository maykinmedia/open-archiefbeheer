import {
  AttributeData,
  Form,
  FormField,
  FormProps,
  ModalProps,
  ModalServiceContext,
  P,
  useDialog,
} from "@maykin-ui/admin-ui";
import React, { useContext } from "react";

/**
 * Returns a function which, when called: shows a form dialog with a
 * confirmation callback and an optional cancellation callback.
 */
export const useFormDialog = () => {
  const dialog = useDialog();
  const { setModalProps } = useContext(ModalServiceContext);

  /**
   * Shows a prompt dialog with a confirmation callback and an optional
   * cancellation callback.
   * @param title
   * @param message
   * @param fields
   * @param labelConfirm
   * @param labelCancel
   * @param onConfirm
   * @param onCancel
   * @param modalProps
   * @param formProps
   */
  const fn = (
    title: string,
    message: React.ReactNode,
    fields: FormField[],
    labelConfirm: string,
    labelCancel: string,
    onConfirm: (data: AttributeData) => void,
    onCancel?: () => void,
    modalProps?: Partial<ModalProps>,
    formProps?: FormProps,
  ) => {
    dialog(
      title,
      <>
        {typeof message === "string" ? <P>{message}</P> : message}
        <Form
          fields={fields}
          justify="stretch"
          labelSubmit={labelConfirm}
          secondaryActions={[
            {
              children: labelCancel,
              type: "button",
              variant: "secondary",
              onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel?.();
                setModalProps({ open: false });
              },
            },
          ]}
          validateOnChange={true}
          onSubmit={(e, data) => {
            e.preventDefault();
            e.stopPropagation();
            onConfirm(data);
            setModalProps({ open: false });
          }}
          {...formProps}
        />
      </>,
      undefined,
      { allowClose: false, ...modalProps },
    );
  };

  return fn;
};
