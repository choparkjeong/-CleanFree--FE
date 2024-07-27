"use client";

import React, { useState, ChangeEvent, useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import styles from "@/styles/pages/write.module.scss";
import QuestionTitle from "@/components/ui/QuestionTitle";
import { uploadImageToS3 } from "@/utils/image/aws";
import { useRouter } from "next/navigation";

interface SkinCareDiary {
  authorization: any;
  data: any;
}

export default function SkinCareDiary({ authorization, data }: SkinCareDiary) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [isAlcoholConsumed, setIsAlcoholConsumed] = useState<boolean>(false);
  const [isExercised, setIsExercised] = useState<boolean>(false);
  const [product, setProduct] = useState<string>("");
  const [products, setProducts] = useState<string[]>(data);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [memo, setMemo] = useState<string>("");
  const [writeTime, setWriteTime] = useState(new Date());

  const cropperRef = useRef<any>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedStatus(event.target.value);
  };

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    setIsLoading(true); // Set loading to true when starting to upload
    const url = await uploadImageToS3(file);
    setImageUrl(url);
    setIsLoading(false); // Set loading to false once upload is complete
    console.log("url: ", url);
    console.log("imageUrl: ", imageUrl);
  };

  const handleCrop = async () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        canvas.toBlob(async (blob: any) => {
          if (blob) {
            const file = new File([blob], "cropped-image.jpg", {
              type: "image/jpeg",
            });
            const url = await uploadImageToS3(file);
            setImageUrl(url);
            setIsLoading(false); // Set loading to false after cropping and upload
            setIsModalOpen(false);
          }
        });
      }
    }
  };

  const handleSleepHoursChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSleepHours(Number(event.target.value));
  };

  const toggleAlcoholConsumption = () => {
    setIsAlcoholConsumed((prev) => !prev);
  };

  const toggleExerciseStatus = () => {
    setIsExercised((prev) => !prev);
  };

  const handleProductChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProduct(event.target.value);
  };

  const addProduct = () => {
    if (product.trim() !== "") {
      setProducts((prevProducts) => [...prevProducts, product.trim()]);
      setProduct(""); // Clear the input field
    }
  };

  const removeProduct = (index: number) => {
    setProducts((prevProducts) => prevProducts.filter((_, i) => i !== index));
  };

  const handleMemoChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMemo(event.target.value);
  };

  const handleSubmit = async () => {
    let status;

    if (selectedStatus === "좋음") {
      status = "GOOD";
    } else if (selectedStatus === "보통") {
      status = "NORMAL";
    } else if (selectedStatus === "나쁨") {
      status = "BAD";
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_REACT_APP_API_URL}/diary/write`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authorization}`,
          },
          body: JSON.stringify({
            skinStatus: status,
            thumbnailUrl: imageUrl,
            cosmetics: products,
            sleepTime: sleepHours,
            memo: memo,
            writeTime: writeTime.toISOString(),
            alcohol: isAlcoholConsumed,
            exercise: isExercised,
          }),
        }
      );

      if (!response.ok) {
        router.push("/login");
      } else {
        router.replace("/");
      }
      const data = await response.json();
      console.log("Success:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className={styles["write-skinCareDiary-container"]}>
      {/* 오늘의 피부 상태 */}
      <div style={{ paddingTop: "15vh" }} />
      <QuestionTitle text="😁 오늘의 피부 상태는?" />
      <div className={styles["write-SkinCareDiary-checkBox"]}>
        <label>
          <input
            type="radio"
            name="status"
            value="좋음"
            checked={selectedStatus === "좋음"}
            onChange={handleChange}
          />
          <div>좋음🟢</div>
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="보통"
            checked={selectedStatus === "보통"}
            onChange={handleChange}
          />
          <div>보통🟡</div>
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="나쁨"
            checked={selectedStatus === "나쁨"}
            onChange={handleChange}
          />
          <div>나쁨🔴</div>
        </label>
      </div>

      {/* 오늘의 피부 사진 */}
      <div style={{ paddingTop: "5vh" }} />
      <QuestionTitle text="📷 현재 피부를 사진으로 기록해봐요!" />
      {isLoading ? (
        <div className={styles["loading-text"]}>로딩중⌛...</div>
      ) : (
        imageUrl && (
          <div className={styles["write-SkinCareDiary-photoPreview"]}>
            <img
              src={imageUrl}
              alt="Preview"
              className={styles["write-SkinCareDiary-photo-img"]}
            />
          </div>
        )
      )}
      <div className={styles["write-SkinCareDiary-photoBtn-container"]}>
        <label
          className={styles["write-SkinCareDiary-photoBtn"]}
          htmlFor="input-file"
        >
          업로드
        </label>
        <input
          type="file"
          id="input-file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* 오늘의 사용 상품 */}
      <div style={{ paddingTop: "5vh" }} />
      <QuestionTitle text="🧴 현재 사용 제품은 무엇인가요?" />
      <div className={styles["write-SkinCareDiary-input-container"]}>
        <input
          type="text"
          value={product}
          onChange={handleProductChange}
          placeholder="제품명을 입력해주세요"
        />
        <button onClick={addProduct}>추가</button>
      </div>
      <div className={styles["write-SkinCareDiary-products-container"]}>
        {products.map((item, index) => (
          <div
            key={index}
            className={styles["product-tag"]}
            onClick={() => removeProduct(index)}
          >
            <div>{item}</div>
            <div className={styles["product-tag-delete"]}>X</div>
          </div>
        ))}
      </div>

      {/* 오늘의 생활습관 */}
      <div style={{ paddingTop: "5vh" }} />
      <QuestionTitle text="🌗 생활습관을 기록해요!" />

      {/* 음주 여부 및 운동 여부 */}
      <div className={styles["write-SkinCareDiary-lifestyle-container"]}>
        <button
          className={`${styles["write-SkinCareDiary-toggleButton1"]} ${
            isAlcoholConsumed ? styles.active : ""
          } ${isAlcoholConsumed ? styles.redBorder : ""}`}
          onClick={toggleAlcoholConsumption}
        >
          {isAlcoholConsumed ? "🍺음주 O" : "어제 술을 마셨으면 클릭해주세요!"}
        </button>
        <button
          className={`${styles["write-SkinCareDiary-toggleButton2"]} ${
            isExercised ? styles.active : ""
          } ${isExercised ? styles.redBorder : ""}`}
          onClick={toggleExerciseStatus}
        >
          {isExercised ? "👟운동 O" : "운동하셨다면 클릭해주세요!"}
        </button>
      </div>

      {/* 수면시간 드롭다운 */}
      <div className={styles["write-SkinCareDiary-sleep-container"]}>
        <select
          value={sleepHours === null ? "" : sleepHours}
          onChange={handleSleepHoursChange}
        >
          <option value="" disabled>
            수면 시간
          </option>
          {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
            <option key={hour} value={hour}>
              {hour} 시간
            </option>
          ))}
        </select>
      </div>

      {/* 오늘의 피부 일지 */}
      <div style={{ paddingTop: "5vh" }} />
      <QuestionTitle text="✏️ 기타 메모" />
      <div className={styles["write-SkinCareDiary-textArea-container"]}>
        <textarea
          className={styles["write-SkinCareDiary-textArea"]}
          onChange={handleMemoChange}
        />
      </div>

      {/* Cropper Modal */}
      {/* {isModalOpen && (
        <div className={styles["cropper-modal"]}>
          <div className={styles["cropper-modal-content"]}>
            <Cropper
              src={previewUrl}
              style={{ height: "fit-content", width: "100%" }}
              initialAspectRatio={1}
              aspectRatio={1}
              guides={false}
              ref={cropperRef}
              zoomable={false}
            />
            <div className={styles["cropper-modal-buttons"]}>
              <button onClick={handleCrop}>적용</button>
              <button onClick={() => setIsModalOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )} */}

      <div style={{ paddingTop: "5vh" }} />

      {/* Submit Button */}
      <button onClick={handleSubmit} className={styles["submit-button"]}>
        제출
      </button>

      {/* footer 패딩 */}
      <div style={{ paddingTop: "5vh" }} />
    </div>
  );
}
