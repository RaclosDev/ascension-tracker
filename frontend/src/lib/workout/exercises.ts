import type { Exercise } from "./types";

export const EXERCISE_CATALOG: any[] = [
  {
    "id": "ex-0001",
    "name": "3/4 sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0001-2gPfomN.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-0002",
    "name": "45° side bend",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0002-Hy9D21L.gif",
    "synergists": {
      "abdominales": 8,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0003",
    "name": "Air bike",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0003-1ZFqTDN.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 3,
      "cardio": 4
    }
  },
  {
    "id": "ex-1512",
    "name": "All fours squad stretch",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1512-qBcKorM.gif",
    "synergists": {
      "cuadriceps": 5,
      "aductores": 3
    }
  },
  {
    "id": "ex-0006",
    "name": "Alternate heel touchers",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0006-qaZVsGk.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 2
    }
  },
  {
    "id": "ex-0007",
    "name": "Alternate lateral pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0007-4IKbhHV.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "biceps": 6,
      "antebrazos": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-1368",
    "name": "Ankle circles",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1368-uL9CsKm.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-3293",
    "name": "Archer pull up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3293-72BC5Za.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 7,
      "biceps": 7,
      "antebrazos": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3294",
    "name": "Archer push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3294-A9qxk2F.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-2355",
    "name": "Arm slingers hanging bent knee legs",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2355-uWpxD4v.gif",
    "synergists": {
      "abdominales": 8,
      "antebrazos": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-2333",
    "name": "Arm slingers hanging straight legs",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2333-PXTIwgu.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 4,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-3214",
    "name": "Arms apart circular toe touch (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3214-RtyAsy1.gif",
    "synergists": {
      "femorales": 6,
      "gluteos": 5,
      "lumbares": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3204",
    "name": "Arms overhead full sit-up (male)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3204-NAkmgdx.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 4,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-0009",
    "name": "Assisted chest dip (kneeling)",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0009-PAgTVaK.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0011",
    "name": "Assisted hanging knee raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0011-03lzqwk.gif",
    "synergists": {
      "abdominales": 7,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0010",
    "name": "Assisted hanging knee raise with throw down",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0010-8K0w2yA.gif",
    "synergists": {
      "abdominales": 8,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1708",
    "name": "Assisted lying calves stretch",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1708-GxDwDX0.gif",
    "synergists": {
      "gemelos": 5,
      "femorales": 3
    }
  },
  {
    "id": "ex-1709",
    "name": "Assisted lying glutes stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1709-yn0LjwL.gif",
    "synergists": {
      "gluteos": 5,
      "femorales": 3
    }
  },
  {
    "id": "ex-1710",
    "name": "Assisted lying gluteus and piriformis stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1710-RQNVT10.gif",
    "synergists": {
      "gluteos": 5,
      "abductores": 4
    }
  },
  {
    "id": "ex-0012",
    "name": "Assisted lying leg raise with lateral throw down",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0012-UGhRD1A.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-0013",
    "name": "Assisted lying leg raise with throw down",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0013-VX5YKR5.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-0014",
    "name": "Assisted motion russian twist",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0014-r7cT9YD.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 3
    }
  },
  {
    "id": "ex-0015",
    "name": "Assisted parallel close grip pull-up",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0015-vrhHa6D.gif",
    "synergists": {
      "dorsales": 8,
      "biceps": 7,
      "espalda_alta": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0016",
    "name": "Assisted prone hamstring",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0016-VedGSby.gif",
    "synergists": {
      "femorales": 7,
      "gluteos": 4,
      "gemelos": 3
    }
  },
  {
    "id": "ex-1713",
    "name": "Assisted prone lying quads stretch",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1713-YUYAMEj.gif",
    "synergists": {
      "cuadriceps": 5,
      "aductores": 3
    }
  },
  {
    "id": "ex-1714",
    "name": "Assisted prone rectus femoris stretch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1714-2Ryn564.gif",
    "synergists": {
      "cuadriceps": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0017",
    "name": "Assisted pull-up",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0017-kiJ4Z2K.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 6,
      "biceps": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1716",
    "name": "Assisted seated pectoralis major stretch with stability ball",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1716-RoV1Rfa.gif",
    "synergists": {
      "pecho": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-1712",
    "name": "Assisted side lying adductor stretch",
    "muscle": "aductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1712-hC6oYY5.gif",
    "synergists": {
      "aductores": 5,
      "femorales": 3
    }
  },
  {
    "id": "ex-1758",
    "name": "Assisted sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1758-aumB2IV.gif",
    "synergists": {
      "abdominales": 7,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-1431",
    "name": "Assisted standing chin-up",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1431-7OeHptV.gif",
    "synergists": {
      "dorsales": 8,
      "biceps": 7,
      "espalda_alta": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1432",
    "name": "Assisted standing pull-up",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1432-f4xtKBj.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 6,
      "biceps": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0018",
    "name": "Assisted standing triceps extension (with towel)",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0018-7HcfMBP.gif",
    "synergists": {
      "triceps": 7,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0019",
    "name": "Assisted triceps dip (kneeling)",
    "muscle": "triceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0019-J60bN17.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-2364",
    "name": "Assisted wide-grip chest dip (kneeling)",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2364-PnZJIrk.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-3220",
    "name": "Astride jumps (male)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3220-f9lVSSI.gif",
    "synergists": {
      "cardio": 8,
      "cuadriceps": 5,
      "gemelos": 5,
      "gluteos": 4,
      "abductores": 4
    }
  },
  {
    "id": "ex-3672",
    "name": "Back and forth step",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3672-fNGumX0.gif",
    "synergists": {
      "cardio": 7,
      "cuadriceps": 4,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1314",
    "name": "Back extension on exercise ball",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1314-qLpO4vV.gif",
    "synergists": {
      "lumbares": 8,
      "gluteos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-3297",
    "name": "Back lever",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3297-GaSzzuh.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "hombros": 7,
      "lumbares": 7,
      "gluteos": 5,
      "biceps": 5,
      "abdominales": 6
    }
  },
  {
    "id": "ex-1405",
    "name": "Back pec stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1405-chfnQnM.gif",
    "synergists": {
      "pecho": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-1473",
    "name": "Backward jump",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1473-SaDOwk7.gif",
    "synergists": {
      "cuadriceps": 7,
      "gemelos": 6,
      "gluteos": 5,
      "cardio": 6
    }
  },
  {
    "id": "ex-0020",
    "name": "Balance board",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0020-xAySMB0.gif",
    "synergists": {
      "cuadriceps": 5,
      "gemelos": 5,
      "abdominales": 4,
      "gluteos": 4
    }
  },
  {
    "id": "ex-0968",
    "name": "Band alternating biceps curl",
    "muscle": "biceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0968-3omWx6P.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0969",
    "name": "Band alternating v-up",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0969-ztAa1RK.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-0970",
    "name": "Band assisted pull-up",
    "muscle": "dorsales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0970-r1XNRYB.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 6,
      "biceps": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0971",
    "name": "Band assisted wheel rollerout",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0971-zhF9lW4.gif",
    "synergists": {
      "abdominales": 8,
      "dorsales": 5,
      "pecho": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-1254",
    "name": "Band bench press",
    "muscle": "pecho",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1254-khlHMqs.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0980",
    "name": "Band bent-over hip extension",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0980-wSScovH.gif",
    "synergists": {
      "gluteos": 8,
      "femorales": 6,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0972",
    "name": "Band bicycle crunch",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0972-tZkGYZ9.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 4,
      "cardio": 3
    }
  },
  {
    "id": "ex-0974",
    "name": "Band close-grip pulldown",
    "muscle": "dorsales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0974-DptumMx.gif",
    "synergists": {
      "dorsales": 8,
      "biceps": 7,
      "espalda_alta": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0975",
    "name": "Band close-grip push-up",
    "muscle": "triceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0975-ufaxB52.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 7,
      "hombros": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0976",
    "name": "Band concentration curl",
    "muscle": "biceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0976-kmVVAfu.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-3117",
    "name": "Band fixed back close grip pulldown",
    "muscle": "dorsales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3117-4LoWllp.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 6,
      "biceps": 5,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-3116",
    "name": "Band fixed back underhand pulldown",
    "muscle": "dorsales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3116-ZH68exZ.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 7,
      "espalda_alta": 5,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0977",
    "name": "Band front lateral raise",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0977-sTg7iys.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 4,
      "pecho": 3
    }
  },
  {
    "id": "ex-0978",
    "name": "Band front raise",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0978-TFA88iB.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 4,
      "pecho": 3
    }
  },
  {
    "id": "ex-1408",
    "name": "Band hip lift",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1408-E4R8Hz1.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 6,
      "lumbares": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0979",
    "name": "Band horizontal pallof press",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0979-9pa4H5m.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 3,
      "pecho": 2
    }
  },
  {
    "id": "ex-0981",
    "name": "Band jack knife sit-up",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0981-KCBKjma.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-0983",
    "name": "Band kneeling one arm pulldown",
    "muscle": "dorsales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0983-pmnrOp0.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 5,
      "biceps": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0985",
    "name": "Band kneeling twisting crunch",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0985-225x2Vd.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2,
      "hombros": 1
    }
  },
  {
    "id": "ex-0984",
    "name": "Band lying hip internal rotation",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0984-vIICElP.gif",
    "synergists": {
      "gluteos": 9,
      "abductores": 7
    }
  },
  {
    "id": "ex-1002",
    "name": "Band lying straight leg raise",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1002-bbLR7fB.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-0986",
    "name": "Band one arm overhead biceps curl",
    "muscle": "biceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0986-UNAB8ak.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-0987",
    "name": "Band one arm single leg split squat",
    "muscle": "cuadriceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0987-arsYEd3.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "femorales": 4,
      "gemelos": 3,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0988",
    "name": "Band one arm standing low row",
    "muscle": "espalda_alta",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0988-km0sQC0.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 5,
      "antebrazos": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0989",
    "name": "Band one arm twisting chest press",
    "muscle": "pecho",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0989-c16nYGA.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 6,
      "triceps": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0990",
    "name": "Band one arm twisting seated row",
    "muscle": "espalda_alta",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0990-DKBwJrL.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0991",
    "name": "Band pull through",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0991-VtTbiP3.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 8,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0992",
    "name": "Band push sit-up",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0992-zFzbBfL.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 4,
      "triceps": 3
    }
  },
  {
    "id": "ex-0993",
    "name": "Band reverse fly",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0993-sTfvVsG.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0994",
    "name": "Band reverse wrist curl",
    "muscle": "antebrazos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0994-Ezpnw9d.gif",
    "synergists": {
      "antebrazos": 10,
      "biceps": 1
    }
  },
  {
    "id": "ex-0996",
    "name": "Band seated hip internal rotation",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0996-9gbyYKk.gif",
    "synergists": {
      "gluteos": 9,
      "abductores": 6
    }
  },
  {
    "id": "ex-1011",
    "name": "Band seated twist",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1011-S1JXDAG.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0997",
    "name": "Band shoulder press",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0997-peAeMR3.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "trapecios": 4,
      "pecho": 3
    }
  },
  {
    "id": "ex-1018",
    "name": "Band shrug",
    "muscle": "trapecios",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1018-trmte8s.gif",
    "synergists": {
      "trapecios": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0998",
    "name": "Band side triceps extension",
    "muscle": "triceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0998-obe5LMq.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0999",
    "name": "Band single leg calf raise",
    "muscle": "gemelos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0999-9JprnPh.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1000",
    "name": "Band single leg reverse calf raise",
    "muscle": "gemelos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1000-QsSQWbf.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 1
    }
  },
  {
    "id": "ex-1001",
    "name": "Band single leg split squat",
    "muscle": "cuadriceps",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1001-y8bYM8w.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "femorales": 4,
      "gemelos": 3
    }
  },
  {
    "id": "ex-1004",
    "name": "Band squat",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1004-TUZLh71.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 9,
      "femorales": 5,
      "lumbares": 3
    }
  },
  {
    "id": "ex-1003",
    "name": "Band squat row",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1003-w1NOByi.gif",
    "synergists": {
      "gluteos": 8,
      "cuadriceps": 8,
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 4
    }
  },
  {
    "id": "ex-1005",
    "name": "Band standing crunch",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1005-Kzg30R7.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-1022",
    "name": "Band standing rear delt row",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1022-tc5dYrf.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 8,
      "trapecios": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-1007",
    "name": "Band standing twisting crunch",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1007-euq4pwp.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-1008",
    "name": "Band step-up",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1008-d5bTEPV.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 9,
      "femorales": 4,
      "gemelos": 3
    }
  },
  {
    "id": "ex-1009",
    "name": "Band stiff leg deadlift",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1009-kuMiR2T.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 9,
      "lumbares": 7,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-1023",
    "name": "Band straight back stiff leg deadlift",
    "muscle": "gluteos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1023-lHeUULr.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 9,
      "lumbares": 7,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-1010",
    "name": "Band straight leg deadlift",
    "muscle": "lumbares",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1010-KUaoUV8.gif",
    "synergists": {
      "lumbares": 8,
      "femorales": 9,
      "gluteos": 8,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-1012",
    "name": "Band twisting overhead press",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1012-u4bAmKp.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "abdominales": 5,
      "trapecios": 4
    }
  },
  {
    "id": "ex-1369",
    "name": "Band two legs calf raise - (band under both legs) v. 2",
    "muscle": "gemelos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1369-jl6uxZV.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1013",
    "name": "Band underhand pulldown",
    "muscle": "dorsales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1013-k6tUeqS.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 7,
      "espalda_alta": 5,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1014",
    "name": "Band v-up",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1014-H6ETwO9.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-1015",
    "name": "Band vertical pallof press",
    "muscle": "abdominales",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1015-G7PXMlT.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 4,
      "triceps": 3
    }
  },
  {
    "id": "ex-1016",
    "name": "Band wrist curl",
    "muscle": "antebrazos",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1016-vUTfFHw.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1017",
    "name": "Band y-raise",
    "muscle": "hombros",
    "equipment": "banda",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1017-aHDy5O5.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 7,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0023",
    "name": "Barbell alternate biceps curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0023-Yza7XrQ.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0024",
    "name": "Barbell bench front squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0024-Y7YcmIJ.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "abdominales": 5,
      "femorales": 4,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0025",
    "name": "Barbell bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0026",
    "name": "Barbell bench squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0026-W9pFVv1.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "femorales": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-1316",
    "name": "Barbell bent arm pullover",
    "muscle": "dorsales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1316-cA9FuWG.gif",
    "synergists": {
      "dorsales": 9,
      "pecho": 7,
      "triceps": 5,
      "abdominales": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-0027",
    "name": "Barbell bent over row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0027-eZyBC3j.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "lumbares": 6,
      "trapecios": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-2407",
    "name": "Barbell biceps curl (with arm blaster)",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2407-aee2Fcj.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6,
      "hombros": 3
    }
  },
  {
    "id": "ex-0028",
    "name": "Barbell clean and press",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0028-SGY8Zui.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 8,
      "cuadriceps": 7,
      "gluteos": 7,
      "triceps": 7,
      "femorales": 6,
      "lumbares": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0029",
    "name": "Barbell clean-grip front squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0029-qi996YS.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "abdominales": 6,
      "aductores": 5,
      "lumbares": 5,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0030",
    "name": "Barbell close-grip bench press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0030-J6Dx1Mu.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0031",
    "name": "Barbell curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0031-25GPyDY.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6,
      "hombros": 3
    }
  },
  {
    "id": "ex-0032",
    "name": "Barbell deadlift",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0032-ila4NZS.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 9,
      "lumbares": 9,
      "espalda_alta": 8,
      "trapecios": 7,
      "cuadriceps": 7,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0033",
    "name": "Barbell decline bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0033-GrO65fd.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0034",
    "name": "Barbell decline bent arm pullover",
    "muscle": "dorsales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0034-hMEptv0.gif",
    "synergists": {
      "dorsales": 9,
      "pecho": 7,
      "triceps": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0035",
    "name": "Barbell decline close grip to skull press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0035-LMGXZn8.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-1255",
    "name": "Barbell decline pullover",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1255-9sgNE2O.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 8,
      "triceps": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0036",
    "name": "Barbell decline wide-grip press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0036-hl8DUh8.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 5,
      "hombros": 5
    }
  },
  {
    "id": "ex-0037",
    "name": "Barbell decline wide-grip pullover",
    "muscle": "dorsales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0037-Hj4FOCd.gif",
    "synergists": {
      "dorsales": 9,
      "pecho": 7,
      "triceps": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0038",
    "name": "Barbell drag curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0038-IENzBdA.gif",
    "synergists": {
      "biceps": 10,
      "hombros": 5,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1370",
    "name": "Barbell floor calf raise",
    "muscle": "gemelos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1370-2IHEa2T.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 2,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0039",
    "name": "Barbell front chest squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0039-IeTIEqg.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "abdominales": 6,
      "aductores": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0041",
    "name": "Barbell front raise",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0041-b2Uoz54.gif",
    "synergists": {
      "hombros": 10,
      "pecho": 4,
      "trapecios": 4,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0040",
    "name": "Barbell front raise and pullover",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0040-33AzZeV.gif",
    "synergists": {
      "hombros": 8,
      "pecho": 8,
      "dorsales": 7,
      "triceps": 4
    }
  },
  {
    "id": "ex-0042",
    "name": "Barbell front squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0042-zG0zs85.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "abdominales": 6,
      "aductores": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0043",
    "name": "Barbell full squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0043-qXTaZnJ.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "aductores": 6,
      "femorales": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1461",
    "name": "Barbell full squat (back pov)",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1461-DhMl549.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "aductores": 6,
      "femorales": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1462",
    "name": "Barbell full squat (side pov)",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1462-iYzB0Cz.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "aductores": 6,
      "femorales": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1545",
    "name": "Barbell full zercher squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1545-vR1vold.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "abdominales": 7,
      "espalda_alta": 7,
      "biceps": 6,
      "lumbares": 6,
      "aductores": 5
    }
  },
  {
    "id": "ex-1409",
    "name": "Barbell glute bridge",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1409-qKBpF7I.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 6,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-3562",
    "name": "Barbell glute bridge two legs on bench (male)",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3562-qg2PGl6.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 7,
      "cuadriceps": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0044",
    "name": "Barbell good morning",
    "muscle": "femorales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0044-XlZ4lAC.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 8,
      "lumbares": 8,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0045",
    "name": "Barbell guillotine bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0045-GXoaSgn.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "triceps": 6
    }
  },
  {
    "id": "ex-0046",
    "name": "Barbell hack squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0046-5VCj6iH.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "femorales": 5,
      "antebrazos": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1436",
    "name": "Barbell high bar squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1436-Gnfo4FM.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "aductores": 5,
      "femorales": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0047",
    "name": "Barbell incline bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0047-3TZduzM.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 8,
      "triceps": 7
    }
  },
  {
    "id": "ex-1719",
    "name": "Barbell incline close grip bench press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1719-gx7s7uF.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 7
    }
  },
  {
    "id": "ex-0048",
    "name": "Barbell incline reverse-grip press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0048-641mIfk.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0049",
    "name": "Barbell incline row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0049-dmgMp3n.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "trapecios": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0050",
    "name": "Barbell incline shoulder raise",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0050-xi0yckC.gif",
    "synergists": {
      "hombros": 7,
      "trapecios": 7,
      "pecho": 6,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-0051",
    "name": "Barbell jefferson squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0051-pkSoCW9.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "aductores": 7,
      "femorales": 5,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0052",
    "name": "Barbell jm bench press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0052-ZsiqXYa.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0053",
    "name": "Barbell jump squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0053-1gFNTZV.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "gemelos": 7,
      "femorales": 5,
      "cardio": 5
    }
  },
  {
    "id": "ex-1410",
    "name": "Barbell lateral lunge",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1410-py1HSzx.gif",
    "synergists": {
      "cuadriceps": 8,
      "gluteos": 8,
      "aductores": 8,
      "abductores": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-1435",
    "name": "Barbell low bar squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1435-bTpEUcm.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "femorales": 6,
      "aductores": 6,
      "lumbares": 6
    }
  },
  {
    "id": "ex-0054",
    "name": "Barbell lunge",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0054-t8iSghb.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "aductores": 5,
      "femorales": 5
    }
  },
  {
    "id": "ex-1720",
    "name": "Barbell lying back of the head tricep extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1720-yg8Totb.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-0055",
    "name": "Barbell lying close-grip press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0055-EcaV7aL.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0056",
    "name": "Barbell lying close-grip triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0056-HJ63mSO.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0057",
    "name": "Barbell lying extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0057-EMpUwRI.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0058",
    "name": "Barbell lying lifting (on hip)",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0058-SNFfUff.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0059",
    "name": "Barbell lying preacher curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0059-SYJ4Bkt.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0061",
    "name": "Barbell lying triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0061-iZop9xO.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0060",
    "name": "Barbell lying triceps extension skull crusher",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0060-h8LFzo9.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0063",
    "name": "Barbell narrow stance squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0063-elhhVgj.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "femorales": 5,
      "lumbares": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0064",
    "name": "Barbell one arm bent over row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0064-Jsgsc27.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "trapecios": 5,
      "antebrazos": 5,
      "lumbares": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0065",
    "name": "Barbell one arm floor press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0065-vtusOWT.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 8,
      "hombros": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0066",
    "name": "Barbell one arm side deadlift",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0066-2DxtqHL.gif",
    "synergists": {
      "gluteos": 8,
      "lumbares": 8,
      "femorales": 7,
      "cuadriceps": 7,
      "antebrazos": 6,
      "abdominales": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0067",
    "name": "Barbell one arm snatch",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0067-xHKN2s8.gif",
    "synergists": {
      "hombros": 8,
      "trapecios": 8,
      "gluteos": 7,
      "cuadriceps": 7,
      "lumbares": 6,
      "abdominales": 6,
      "femorales": 6
    }
  },
  {
    "id": "ex-0068",
    "name": "Barbell one leg squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0068-uKyN64F.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 6,
      "aductores": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0069",
    "name": "Barbell overhead squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0069-gfk9kD4.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 7,
      "hombros": 7,
      "abdominales": 7,
      "trapecios": 6,
      "lumbares": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-1411",
    "name": "Barbell palms down wrist curl over a bench",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1411-yzYH9pI.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1412",
    "name": "Barbell palms up wrist curl over a bench",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1412-SJAA2IQ.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-3017",
    "name": "Barbell pendlay row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3017-r0z6xzQ.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "trapecios": 7,
      "biceps": 6,
      "lumbares": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1751",
    "name": "Barbell pin presses",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1751-bndCa3Q.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 7
    }
  },
  {
    "id": "ex-0070",
    "name": "Barbell preacher curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0070-qOgPVf6.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0071",
    "name": "Barbell press sit-up",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0071-wnEscH8.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 7,
      "triceps": 6
    }
  },
  {
    "id": "ex-0072",
    "name": "Barbell prone incline curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0072-WLvTAv5.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0073",
    "name": "Barbell pullover",
    "muscle": "dorsales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0073-i6LWjok.gif",
    "synergists": {
      "dorsales": 9,
      "pecho": 7,
      "triceps": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0022",
    "name": "Barbell pullover to press",
    "muscle": "dorsales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0022-znLogoF.gif",
    "synergists": {
      "dorsales": 8,
      "pecho": 8,
      "triceps": 8,
      "hombros": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0074",
    "name": "Barbell rack pull",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0074-za9Ni4z.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 8,
      "espalda_alta": 8,
      "trapecios": 8,
      "femorales": 7,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0075",
    "name": "Barbell rear delt raise",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0075-Ln9iTbU.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0076",
    "name": "Barbell rear delt row",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0076-S9zHIvU.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-0078",
    "name": "Barbell rear lunge",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0078-VaP75jl.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "femorales": 7,
      "aductores": 5
    }
  },
  {
    "id": "ex-0077",
    "name": "Barbell rear lunge v. 2",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0077-62Nw60O.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "femorales": 7,
      "aductores": 5
    }
  },
  {
    "id": "ex-0079",
    "name": "Barbell revers wrist curl v. 2",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0079-qDnGfDb.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-2187",
    "name": "Barbell reverse close-grip bench press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2187-YqJw82s.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 7
    }
  },
  {
    "id": "ex-0080",
    "name": "Barbell reverse curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0080-xNrS20v.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 8
    }
  },
  {
    "id": "ex-0118",
    "name": "Barbell reverse grip bent over row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0118-SzX3uzM.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 8,
      "trapecios": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1256",
    "name": "Barbell reverse grip decline bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1256-DotAgEF.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 5
    }
  },
  {
    "id": "ex-1257",
    "name": "Barbell reverse grip incline bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1257-DU7I633.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 8,
      "triceps": 8,
      "biceps": 5
    }
  },
  {
    "id": "ex-1317",
    "name": "Barbell reverse grip incline bench row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1317-8d8qJQI.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 7,
      "trapecios": 6
    }
  },
  {
    "id": "ex-1721",
    "name": "Barbell reverse grip skullcrusher",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1721-yRLPCLu.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0081",
    "name": "Barbell reverse preacher curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0081-4LIG9xr.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-0082",
    "name": "Barbell reverse wrist curl",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0082-LsZkfU6.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0084",
    "name": "Barbell rollerout",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0084-7M66AVi.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 6,
      "dorsales": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0083",
    "name": "Barbell rollerout from bench",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0083-Gxg9lDc.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 5,
      "dorsales": 5,
      "hombros": 5
    }
  },
  {
    "id": "ex-0085",
    "name": "Barbell romanian deadlift",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0085-wQ2c4XD.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 9,
      "lumbares": 7,
      "antebrazos": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0086",
    "name": "Barbell seated behind head military press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0086-ngPpyRS.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0087",
    "name": "Barbell seated bradford rocky press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0087-0dCyly0.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6
    }
  },
  {
    "id": "ex-0088",
    "name": "Barbell seated calf raise",
    "muscle": "gemelos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0088-ktsFQAZ.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1371",
    "name": "Barbell seated calf raise",
    "muscle": "gemelos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1371-ipvgBnC.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1718",
    "name": "Barbell seated close grip behind neck triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1718-4CBIBOM.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 5
    }
  },
  {
    "id": "ex-0089",
    "name": "Barbell seated close-grip concentration curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0089-1V1gj1u.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0090",
    "name": "Barbell seated good morning",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0090-d960PgE.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 7,
      "femorales": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0091",
    "name": "Barbell seated overhead press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0091-kTbSH9h.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6,
      "pecho": 4
    }
  },
  {
    "id": "ex-0092",
    "name": "Barbell seated overhead triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0092-5uFK1xr.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 5
    }
  },
  {
    "id": "ex-0094",
    "name": "Barbell seated twist",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0094-dFSNDOA.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0095",
    "name": "Barbell shrug",
    "muscle": "trapecios",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0095-dG7tG5y.gif",
    "synergists": {
      "trapecios": 10,
      "antebrazos": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0096",
    "name": "Barbell side bent v. 2",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0096-i4JkUaL.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 6
    }
  },
  {
    "id": "ex-0098",
    "name": "Barbell side split squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0098-W31mMjd.gif",
    "synergists": {
      "cuadriceps": 9,
      "aductores": 8,
      "gluteos": 8,
      "femorales": 6
    }
  },
  {
    "id": "ex-0097",
    "name": "Barbell side split squat v. 2",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0097-HUEqZ1y.gif",
    "synergists": {
      "cuadriceps": 9,
      "aductores": 8,
      "gluteos": 8,
      "femorales": 6
    }
  },
  {
    "id": "ex-1756",
    "name": "Barbell single leg deadlift",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1756-gEyURal.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 9,
      "lumbares": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0099",
    "name": "Barbell single leg split squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0099-gGNQmVt.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 6,
      "aductores": 5
    }
  },
  {
    "id": "ex-2799",
    "name": "Barbell sitted alternate leg raise",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2799-G7xoEzr.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 6
    }
  },
  {
    "id": "ex-2800",
    "name": "Barbell sitted alternate leg raise (female)",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2800-BCs0G2F.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 6,
      "gluteos": 4
    }
  },
  {
    "id": "ex-0100",
    "name": "Barbell skier",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0100-4Leypho.gif",
    "synergists": {
      "hombros": 8,
      "abdominales": 6,
      "trapecios": 5,
      "antebrazos": 4,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0101",
    "name": "Barbell speed squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0101-euI1BwR.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 5,
      "lumbares": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-2810",
    "name": "Barbell split squat v. 2",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2810-HBYyX94.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "aductores": 6,
      "femorales": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0102",
    "name": "Barbell squat (on knees)",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0102-oR7O9LW.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 6,
      "cuadriceps": 5,
      "lumbares": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-2798",
    "name": "Barbell squat jump step rear lunge",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2798-RYcV1kH.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 6,
      "gemelos": 5,
      "cardio": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0103",
    "name": "Barbell standing ab rollerout",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0103-xnInPfE.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 7,
      "dorsales": 6,
      "pecho": 5,
      "hombros": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0104",
    "name": "Barbell standing back wrist curl",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0104-2qTvJAZ.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0105",
    "name": "Barbell standing bradford press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0105-dCPESfR.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6,
      "pecho": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1372",
    "name": "Barbell standing calf raise",
    "muscle": "gemelos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1372-8ozhUIZ.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 3,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0106",
    "name": "Barbell standing close grip curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0106-4dUn2iv.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6,
      "hombros": 3
    }
  },
  {
    "id": "ex-1456",
    "name": "Barbell standing close grip military press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1456-wdRZISl.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 8,
      "pecho": 5,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-2414",
    "name": "Barbell standing concentration curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2414-vsMcDi9.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0107",
    "name": "Barbell standing front raise over head",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0107-S8mo30S.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 6,
      "abdominales": 5,
      "triceps": 4
    }
  },
  {
    "id": "ex-0108",
    "name": "Barbell standing leg calf raise",
    "muscle": "gemelos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0108-rGwhJ5o.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0109",
    "name": "Barbell standing overhead triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0109-dZl9Q27.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 4,
      "abdominales": 4,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0110",
    "name": "Barbell standing reverse grip curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0110-LWuA3aZ.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7,
      "hombros": 3
    }
  },
  {
    "id": "ex-0111",
    "name": "Barbell standing rocking leg calf raise",
    "muscle": "gemelos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0111-6HiHHe0.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0112",
    "name": "Barbell standing twist",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0112-yQe5HpE.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1629",
    "name": "Barbell standing wide grip biceps curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1629-faHKVkK.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-1457",
    "name": "Barbell standing wide military press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1457-Kyd9Rz5.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "trapecios": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0113",
    "name": "Barbell standing wide-grip curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0113-NdIb5Z1.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0114",
    "name": "Barbell step-up",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0114-Kxquu2E.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 9,
      "femorales": 5,
      "gemelos": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0115",
    "name": "Barbell stiff leg good morning",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0115-JrOHAZc.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 8,
      "lumbares": 8
    }
  },
  {
    "id": "ex-0116",
    "name": "Barbell straight leg deadlift",
    "muscle": "femorales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0116-hrVQWvE.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 8,
      "lumbares": 7,
      "trapecios": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0117",
    "name": "Barbell sumo deadlift",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0117-KgI0tqW.gif",
    "synergists": {
      "gluteos": 9,
      "aductores": 8,
      "cuadriceps": 7,
      "femorales": 6,
      "lumbares": 6,
      "trapecios": 5,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3305",
    "name": "Barbell thruster",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3305-f7Y9eDZ.gif",
    "synergists": {
      "cuadriceps": 9,
      "hombros": 9,
      "gluteos": 8,
      "triceps": 7,
      "cardio": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0120",
    "name": "Barbell upright row",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0120-UDlhcO8.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 8,
      "biceps": 6,
      "antebrazos": 5,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0119",
    "name": "Barbell upright row v. 2",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0119-83HoW9X.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 8,
      "biceps": 6,
      "antebrazos": 5,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0121",
    "name": "Barbell upright row v. 3",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0121-fI18Rbc.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 8,
      "biceps": 6,
      "antebrazos": 5,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0122",
    "name": "Barbell wide bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0122-JsKq9so.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-1258",
    "name": "Barbell wide reverse grip bench press",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1258-945zpRg.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6,
      "biceps": 4
    }
  },
  {
    "id": "ex-0124",
    "name": "Barbell wide squat",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0124-s7HX1BY.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "aductores": 8,
      "femorales": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0123",
    "name": "Barbell wide-grip upright row",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0123-RgJDRR1.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 7,
      "biceps": 5,
      "espalda_alta": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0126",
    "name": "Barbell wrist curl",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0126-82LxxkW.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0125",
    "name": "Barbell wrist curl v. 2",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0125-6kSxYnw.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0127",
    "name": "Barbell zercher squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0127-LSTChY9.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "lumbares": 7,
      "biceps": 6,
      "abdominales": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-3212",
    "name": "Basic toe touch (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3212-BbfB8Gb.gif",
    "synergists": {
      "femorales": 8,
      "gluteos": 6,
      "lumbares": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0128",
    "name": "Battling ropes",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0128-RJa4tCo.gif",
    "synergists": {
      "hombros": 8,
      "antebrazos": 7,
      "cardio": 7,
      "abdominales": 6,
      "triceps": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-3360",
    "name": "Bear crawl",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3360-0Yz8WdV.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 7,
      "cuadriceps": 7,
      "cardio": 7,
      "triceps": 5
    }
  },
  {
    "id": "ex-1259",
    "name": "Behind head chest stretch",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1259-QoHIhPl.gif",
    "synergists": {
      "pecho": 6,
      "hombros": 4
    }
  },
  {
    "id": "ex-0129",
    "name": "Bench dip (knees bent)",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0129-RrLske5.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-1399",
    "name": "Bench dip on floor",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1399-9RT8oQW.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 6,
      "pecho": 5
    }
  },
  {
    "id": "ex-0130",
    "name": "Bench hip extension",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0130-u27Kcdz.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 7,
      "lumbares": 6
    }
  },
  {
    "id": "ex-3019",
    "name": "Bench pull-ups",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3019-mExgrF9.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "biceps": 7,
      "antebrazos": 5,
      "trapecios": 5
    }
  },
  {
    "id": "ex-3639",
    "name": "Bent knee lying twist (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3639-6sYyrRX.gif",
    "synergists": {
      "abdominales": 8,
      "lumbares": 5,
      "gluteos": 3
    }
  },
  {
    "id": "ex-1770",
    "name": "Biceps leg concentration curl",
    "muscle": "biceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1770-sJFIDIp.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0139",
    "name": "Biceps narrow pull-ups",
    "muscle": "biceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0139-50BETrz.gif",
    "synergists": {
      "biceps": 9,
      "dorsales": 8,
      "espalda_alta": 7,
      "antebrazos": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0140",
    "name": "Biceps pull-up",
    "muscle": "biceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0140-guT8YnS.gif",
    "synergists": {
      "biceps": 9,
      "dorsales": 9,
      "espalda_alta": 7,
      "antebrazos": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0137",
    "name": "Body-up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0137-U6G2gk9.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 8,
      "hombros": 6,
      "pecho": 5
    }
  },
  {
    "id": "ex-3543",
    "name": "Bodyweight drop jump squat",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3543-wfotm7S.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 9,
      "gemelos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-3544",
    "name": "Bodyweight incline side plank",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3544-5VXmnV5.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 5,
      "gluteos": 4
    }
  },
  {
    "id": "ex-1771",
    "name": "Bodyweight kneeling triceps extension",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1771-s0HKO2I.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-1769",
    "name": "Bodyweight side lying biceps curl",
    "muscle": "biceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1769-gscGLOU.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3168",
    "name": "Bodyweight squatting row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3168-3xK09Sk.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "cuadriceps": 5,
      "gluteos": 4
    }
  },
  {
    "id": "ex-3167",
    "name": "Bodyweight squatting row (with towel)",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3167-BReCuOn.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 6,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-1373",
    "name": "Bodyweight standing calf raise",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1373-bJYHBIN.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-3156",
    "name": "Bodyweight standing close-grip one arm row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3156-v2DfH14.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3158",
    "name": "Bodyweight standing close-grip row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3158-tig3PXb.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3162",
    "name": "Bodyweight standing one arm row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3162-xbkPfaw.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3161",
    "name": "Bodyweight standing one arm row (with towel)",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3161-O4oIqQD.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3166",
    "name": "Bodyweight standing row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3166-wd4ds3s.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3165",
    "name": "Bodyweight standing row (with towel)",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3165-uTv34oq.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0138",
    "name": "Bottoms-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0138-CI6baTY.gif",
    "synergists": {
      "abdominales": 9,
      "femorales": 4
    }
  },
  {
    "id": "ex-1374",
    "name": "Box jump down with one leg stabilization",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1374-iPm26QU.gif",
    "synergists": {
      "gemelos": 8,
      "cuadriceps": 8,
      "gluteos": 7,
      "femorales": 5
    }
  },
  {
    "id": "ex-2466",
    "name": "Bridge - mountain climber (cross body)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2466-9c6T1YX.gif",
    "synergists": {
      "abdominales": 9,
      "gluteos": 6,
      "hombros": 5,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-1160",
    "name": "Burpee",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1160-dK9394r.gif",
    "synergists": {
      "cardio": 9,
      "cuadriceps": 7,
      "pecho": 6,
      "hombros": 6,
      "triceps": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0870",
    "name": "Butt-ups",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0870-qcNN2FN.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 4
    }
  },
  {
    "id": "ex-1494",
    "name": "Butterfly yoga pose",
    "muscle": "aductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1494-bWlZvXh.gif",
    "synergists": {
      "aductores": 10,
      "abductores": 2,
      "gluteos": 1
    }
  },
  {
    "id": "ex-0148",
    "name": "Cable alternate shoulder press",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0148-KHPZL0b.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "pecho": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0149",
    "name": "Cable alternate triceps extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0149-Gchi5Tr.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-3235",
    "name": "Cable assisted inverse leg curl",
    "muscle": "femorales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3235-zHEpuuc.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0150",
    "name": "Cable bar lateral pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0150-eYnzaCm.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 7,
      "biceps": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0151",
    "name": "Cable bench press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0151-7xI5MXA.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-1630",
    "name": "Cable close grip curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1630-BCGQ6J5.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-1631",
    "name": "Cable concentration curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1631-NvfE43H.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0152",
    "name": "Cable concentration extension (on knee)",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0152-Db7eEgw.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0153",
    "name": "Cable cross-over lateral pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0153-OQ1otBN.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 7,
      "biceps": 6
    }
  },
  {
    "id": "ex-0154",
    "name": "Cable cross-over revers fly",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0154-aqvSOQE.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0155",
    "name": "Cable cross-over variation",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0155-0CXGHya.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6
    }
  },
  {
    "id": "ex-0868",
    "name": "Cable curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0868-G08RZcQ.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0157",
    "name": "Cable deadlift",
    "muscle": "gluteos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0157-eGDudUV.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 7,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-0158",
    "name": "Cable decline fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0158-7saC5zz.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-1260",
    "name": "Cable decline one arm press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1260-KHGNa16.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 6,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1261",
    "name": "Cable decline press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1261-2Pya1cP.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0159",
    "name": "Cable decline seated wide-grip row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0159-kesXOpB.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-1632",
    "name": "Cable drag curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1632-dXz8zjF.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-0160",
    "name": "Cable floor seated wide-grip row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0160-veXwo0D.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0161",
    "name": "Cable forward raise",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0161-hvHhCv8.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4
    }
  },
  {
    "id": "ex-0162",
    "name": "Cable front raise",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0162-u2X71Np.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4
    }
  },
  {
    "id": "ex-0164",
    "name": "Cable front shoulder raise",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0164-mTT3KLn.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4
    }
  },
  {
    "id": "ex-0165",
    "name": "Cable hammer curl (with rope)",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0165-HPlPoQA.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1722",
    "name": "Cable high pulley overhead tricep extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1722-1xHyxys.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0167",
    "name": "Cable high row (kneeling)",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0167-ZSJNetl.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0168",
    "name": "Cable hip adduction",
    "muscle": "aductores",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0168-hBGWILP.gif",
    "synergists": {
      "aductores": 9,
      "gluteos": 4
    }
  },
  {
    "id": "ex-0169",
    "name": "Cable incline bench press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0169-Vh0GsK4.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 7,
      "triceps": 6
    }
  },
  {
    "id": "ex-1318",
    "name": "Cable incline bench row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1318-yaMIo4D.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6
    }
  },
  {
    "id": "ex-0171",
    "name": "Cable incline fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0171-tBWXbIT.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 7
    }
  },
  {
    "id": "ex-0170",
    "name": "Cable incline fly (on stability ball)",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0170-27NNGFr.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0172",
    "name": "Cable incline pushdown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0172-1PK5Uo3.gif",
    "synergists": {
      "dorsales": 9,
      "triceps": 5,
      "pecho": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0173",
    "name": "Cable incline triceps extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0173-Hx1WC8I.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0174",
    "name": "Cable judo flip",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0174-MvQPqVW.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 4,
      "espalda_alta": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0860",
    "name": "Cable kickback",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0860-HEJ6DIX.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 2,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0175",
    "name": "Cable kneeling crunch",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0175-WW95auq.gif",
    "synergists": {
      "abdominales": 9,
      "dorsales": 2
    }
  },
  {
    "id": "ex-3697",
    "name": "Cable kneeling rear delt row (with rope) (male)",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3697-G61cXLk.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-0176",
    "name": "Cable kneeling triceps extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0176-KWdF2JI.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 3,
      "hombros": 2
    }
  },
  {
    "id": "ex-2330",
    "name": "Cable lat pulldown full range of motion",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2330-LEprlgG.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "biceps": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0177",
    "name": "Cable lateral pulldown (with rope attachment)",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0177-CuaWCmC.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-2616",
    "name": "Cable lateral pulldown with v-bar",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2616-4c9BhzB.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "biceps": 6,
      "trapecios": 3
    }
  },
  {
    "id": "ex-0178",
    "name": "Cable lateral raise",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0178-goJ6ezq.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0179",
    "name": "Cable low fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0179-FVmZVhk.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "biceps": 3
    }
  },
  {
    "id": "ex-0180",
    "name": "Cable low seated row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0180-hvV79Si.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "trapecios": 5,
      "biceps": 5,
      "lumbares": 3
    }
  },
  {
    "id": "ex-1634",
    "name": "Cable lying bicep curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1634-otqIxU4.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0182",
    "name": "Cable lying close-grip curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0182-61GrD55.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0184",
    "name": "Cable lying extension pullover (with rope attachment)",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0184-Q2Eu1Ax.gif",
    "synergists": {
      "dorsales": 8,
      "triceps": 7,
      "pecho": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-0185",
    "name": "Cable lying fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0185-lJJ7Yq8.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 4
    }
  },
  {
    "id": "ex-0186",
    "name": "Cable lying triceps extension v. 2",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0186-uxJcFUU.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0188",
    "name": "Cable middle fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0188-xLYSdtg.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-0189",
    "name": "Cable one arm bent over row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0189-EIsE3u8.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 5,
      "trapecios": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0190",
    "name": "Cable one arm curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0190-YTur5nR.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1262",
    "name": "Cable one arm decline chest fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1262-w4dLzSx.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1263",
    "name": "Cable one arm fly on exercise ball",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1263-hHy8tQG.gif",
    "synergists": {
      "pecho": 8,
      "abdominales": 6,
      "hombros": 4
    }
  },
  {
    "id": "ex-1264",
    "name": "Cable one arm incline fly on exercise ball",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1264-P14Dz9D.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 5,
      "abdominales": 6
    }
  },
  {
    "id": "ex-1265",
    "name": "Cable one arm incline press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1265-GKEH6jj.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1266",
    "name": "Cable one arm incline press on exercise ball",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1266-6t00BsF.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 6,
      "triceps": 5,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0191",
    "name": "Cable one arm lateral bent-over",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0191-dB07vDu.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0192",
    "name": "Cable one arm lateral raise",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0192-wEulIzp.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-1633",
    "name": "Cable one arm preacher curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1633-eHBlPsa.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1267",
    "name": "Cable one arm press on exercise ball",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1267-MKIelrR.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 5,
      "hombros": 5,
      "abdominales": 6
    }
  },
  {
    "id": "ex-3563",
    "name": "Cable one arm pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3563-U5INZY6.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-1635",
    "name": "Cable one arm reverse preacher curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1635-ZXnjcOQ.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-0193",
    "name": "Cable one arm straight back high row (kneeling)",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0193-WrYPP2g.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "trapecios": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-1723",
    "name": "Cable one arm tricep pushdown",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1723-qRZ5S1N.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-1636",
    "name": "Cable overhead curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1636-wDUqY2u.gif",
    "synergists": {
      "biceps": 9,
      "hombros": 4,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1637",
    "name": "Cable overhead curl on exercise ball",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1637-ioTf098.gif",
    "synergists": {
      "biceps": 9,
      "hombros": 4,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0194",
    "name": "Cable overhead triceps extension (rope attachment)",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0194-2IxROQ1.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-1319",
    "name": "Cable palm rotational row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1319-OmQ8w0p.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 5,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0195",
    "name": "Cable preacher curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0195-P2lNrGL.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1268",
    "name": "Cable press on exercise ball",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1268-vAwm6rK.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 6,
      "hombros": 5,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0196",
    "name": "Cable pull through (with rope)",
    "muscle": "gluteos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0196-OM46QHm.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 7,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0198",
    "name": "Cable pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0198-RVwzP10.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-0197",
    "name": "Cable pulldown (pro lat bar)",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0197-qdRxqCj.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-1638",
    "name": "Cable pulldown bicep curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1638-QTXKWPh.gif",
    "synergists": {
      "biceps": 9,
      "dorsales": 4,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0201",
    "name": "Cable pushdown",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0201-3ZflifB.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0199",
    "name": "Cable pushdown (straight arm) v. 2",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0199-PskORrA.gif",
    "synergists": {
      "dorsales": 9,
      "triceps": 4,
      "pecho": 3,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0200",
    "name": "Cable pushdown (with rope attachment)",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0200-dU605di.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0202",
    "name": "Cable rear delt row (stirrups)",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0202-yUdIGNs.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-0203",
    "name": "Cable rear delt row (with rope)",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0203-wqNPGCg.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-0204",
    "name": "Cable rear drive",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0204-c3QQLPi.gif",
    "synergists": {
      "triceps": 8,
      "hombros": 4,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0205",
    "name": "Cable rear pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0205-SpsOSXk.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-0873",
    "name": "Cable reverse crunch",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0873-RqOtqD7.gif",
    "synergists": {
      "abdominales": 10,
      "femorales": 1
    }
  },
  {
    "id": "ex-0206",
    "name": "Cable reverse curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0206-eOG0r6v.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-2406",
    "name": "Cable reverse grip triceps pushdown (sz-bar) (with arm blaster)",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2406-ThKP69G.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1413",
    "name": "Cable reverse one arm curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1413-gVlnLIJ.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-0209",
    "name": "Cable reverse preacher curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0209-IwX5NqK.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-0210",
    "name": "Cable reverse wrist curl",
    "muscle": "antebrazos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0210-eYmsEPR.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0207",
    "name": "Cable reverse-grip pushdown",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0207-VjYliFZ.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0208",
    "name": "Cable reverse-grip straight back seated high row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0208-PNtsX17.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-1320",
    "name": "Cable rope crossover seated row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1320-UFGF6gk.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 6,
      "hombros": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-1321",
    "name": "Cable rope elevated seated row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1321-c8oybX6.gif",
    "synergists": {
      "espalda_alta": 9,
      "trapecios": 6,
      "hombros": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-1322",
    "name": "Cable rope extension incline bench row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1322-MgKwAAo.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "hombros": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-1639",
    "name": "Cable rope hammer preacher curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1639-PcPe0P5.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1724",
    "name": "Cable rope high pulley overhead tricep extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1724-NN8nSNT.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3
    }
  },
  {
    "id": "ex-1725",
    "name": "Cable rope incline tricep extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1725-ZujAdR9.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 2,
      "pecho": 1
    }
  },
  {
    "id": "ex-1726",
    "name": "Cable rope lying on floor tricep extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1726-U3ffHlY.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 1
    }
  },
  {
    "id": "ex-1640",
    "name": "Cable rope one arm hammer preacher curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1640-4hATdoB.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1323",
    "name": "Cable rope seated row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1323-SJqRxOt.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 5,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0211",
    "name": "Cable russian twists (on stability ball)",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0211-d9Xaxq6.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 3
    }
  },
  {
    "id": "ex-2144",
    "name": "Cable seated chest press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2144-nIR4Rwl.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0212",
    "name": "Cable seated crunch",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0212-8xUv4J7.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 1
    }
  },
  {
    "id": "ex-1641",
    "name": "Cable seated curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1641-8oYqOt9.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0213",
    "name": "Cable seated high row (v-bar)",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0213-pwt0pnM.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 8,
      "biceps": 5
    }
  },
  {
    "id": "ex-0214",
    "name": "Cable seated one arm alternate row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0214-vpp9Ku2.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1642",
    "name": "Cable seated one arm concentration curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1642-rZ80Gbp.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1643",
    "name": "Cable seated overhead curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1643-DpWMFP5.gif",
    "synergists": {
      "biceps": 9,
      "hombros": 4
    }
  },
  {
    "id": "ex-0215",
    "name": "Cable seated rear lateral raise",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0215-x825CZm.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0861",
    "name": "Cable seated row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0861-fUBheHs.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 5,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0216",
    "name": "Cable seated shoulder internal rotation",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0216-YPoVrBi.gif",
    "synergists": {
      "hombros": 8,
      "pecho": 5
    }
  },
  {
    "id": "ex-2399",
    "name": "Cable seated twist",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2399-UEjSrKI.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0218",
    "name": "Cable seated wide-grip row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0218-qcY50ZD.gif",
    "synergists": {
      "espalda_alta": 9,
      "trapecios": 6,
      "hombros": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-0219",
    "name": "Cable shoulder press",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0219-PzQanLE.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "pecho": 4
    }
  },
  {
    "id": "ex-0220",
    "name": "Cable shrug",
    "muscle": "trapecios",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0220-Eg98Ft9.gif",
    "synergists": {
      "trapecios": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0222",
    "name": "Cable side bend",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0222-wPypxFY.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0221",
    "name": "Cable side bend crunch (bosu ball)",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0221-qatbkEd.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0223",
    "name": "Cable side crunch",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0223-q2ADGqV.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-1717",
    "name": "Cable squat row (with rope attachment)",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1717-f7fnAIB.gif",
    "synergists": {
      "dorsales": 7,
      "espalda_alta": 7,
      "cuadriceps": 6,
      "gluteos": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-1644",
    "name": "Cable squatting curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1644-3XFdb1Z.gif",
    "synergists": {
      "biceps": 9,
      "cuadriceps": 5,
      "gluteos": 4
    }
  },
  {
    "id": "ex-0224",
    "name": "Cable standing back wrist curl",
    "muscle": "antebrazos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0224-VhX2JdE.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1375",
    "name": "Cable standing calf raise",
    "muscle": "gemelos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1375-yl2IYyy.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0225",
    "name": "Cable standing cross-over high reverse fly",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0225-P5p0j8B.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0226",
    "name": "Cable standing crunch",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0226-jpgqxiS.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0874",
    "name": "Cable standing crunch (with rope attachment)",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0874-XU3ePuv.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0227",
    "name": "Cable standing fly",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0227-Pr9Rhf4.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-0228",
    "name": "Cable standing hip extension",
    "muscle": "gluteos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0228-Kpajagk.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 6
    }
  },
  {
    "id": "ex-0229",
    "name": "Cable standing inner curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0229-YwnI4ja.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0230",
    "name": "Cable standing lift",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0230-qFpAkpP.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 5
    }
  },
  {
    "id": "ex-0231",
    "name": "Cable standing one arm triceps extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0231-sYCcnon.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 1
    }
  },
  {
    "id": "ex-1376",
    "name": "Cable standing one leg calf raise",
    "muscle": "gemelos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1376-fgc9Xdl.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0232",
    "name": "Cable standing pulldown (with rope)",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0232-CvPn9WV.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 6,
      "triceps": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-0233",
    "name": "Cable standing rear delt row (with rope)",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0233-ZfyAGhK.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5,
      "biceps": 4
    }
  },
  {
    "id": "ex-1727",
    "name": "Cable standing reverse grip one arm overhead tricep extension",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1727-i11JWU7.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 4,
      "hombros": 3,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0234",
    "name": "Cable standing row (v-bar)",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0234-4f8RXP8.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "trapecios": 5,
      "antebrazos": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0235",
    "name": "Cable standing shoulder external rotation",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0235-FWdVhcW.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0236",
    "name": "Cable standing twist row (v-bar)",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0236-JOZhu2h.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "abdominales": 6,
      "biceps": 5,
      "trapecios": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-1269",
    "name": "Cable standing up straight crossovers",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1269-UKWTJWR.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5,
      "triceps": 3
    }
  },
  {
    "id": "ex-0238",
    "name": "Cable straight arm pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0238-x69MAlq.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "triceps": 5,
      "pecho": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0237",
    "name": "Cable straight arm pulldown (with rope)",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0237-DT14T9T.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 6,
      "triceps": 5,
      "pecho": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0239",
    "name": "Cable straight back seated row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0239-Tq6gbK6.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "trapecios": 6,
      "biceps": 6,
      "antebrazos": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0240",
    "name": "Cable supine reverse fly",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0240-PQcUlDi.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 6
    }
  },
  {
    "id": "ex-2464",
    "name": "Cable thibaudeau kayak row",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2464-ZgwWBoC.gif",
    "synergists": {
      "dorsales": 9,
      "abdominales": 7,
      "espalda_alta": 6,
      "biceps": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0241",
    "name": "Cable triceps pushdown (v-bar)",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0241-gAwDzB3.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-2405",
    "name": "Cable triceps pushdown (v-bar) (with arm blaster)",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2405-OxJk1fg.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0242",
    "name": "Cable tuck reverse crunch",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0242-TXtXc84.gif",
    "synergists": {
      "abdominales": 9,
      "femorales": 3,
      "gluteos": 3
    }
  },
  {
    "id": "ex-0243",
    "name": "Cable twist",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0243-aVs3BR3.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 3,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0862",
    "name": "Cable twist (up-down)",
    "muscle": "abdominales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0862-fhZQPlV.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0244",
    "name": "Cable twisting pull",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0244-zCgxPbV.gif",
    "synergists": {
      "dorsales": 8,
      "abdominales": 7,
      "espalda_alta": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-1645",
    "name": "Cable two arm curl on incline bench",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1645-H9y3Dkr.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-1728",
    "name": "Cable two arm tricep kickback",
    "muscle": "triceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1728-vvNjDJS.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0245",
    "name": "Cable underhand pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0245-xBYcQHj.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 7,
      "espalda_alta": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1270",
    "name": "Cable upper chest crossovers",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1270-j7XMAyn.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 3
    }
  },
  {
    "id": "ex-1324",
    "name": "Cable upper row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1324-PQStVXH.gif",
    "synergists": {
      "espalda_alta": 9,
      "trapecios": 7,
      "hombros": 6,
      "biceps": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0246",
    "name": "Cable upright row",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0246-cALKspW.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 8,
      "biceps": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1325",
    "name": "Cable wide grip rear pulldown behind neck",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1325-CmEr4pM.gif",
    "synergists": {
      "dorsales": 8,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 5,
      "hombros": 5
    }
  },
  {
    "id": "ex-0247",
    "name": "Cable wrist curl",
    "muscle": "antebrazos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0247-LrV4s90.gif",
    "synergists": {
      "antebrazos": 10,
      "biceps": 2
    }
  },
  {
    "id": "ex-1407",
    "name": "Calf push stretch with hands against wall",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1407-PzNxakt.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1377",
    "name": "Calf stretch with hands against wall",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1377-m0tCHqc.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1378",
    "name": "Calf stretch with rope",
    "muscle": "gemelos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1378-1LVFcEn.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0248",
    "name": "Cambered bar lying row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0248-R5swFnc.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "trapecios": 6,
      "biceps": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-2963",
    "name": "Captains chair straight leg raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2963-weoDEpH.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-1548",
    "name": "Chair leg extended stretch",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1548-xGgAGPm.gif",
    "synergists": {
      "cuadriceps": 8,
      "femorales": 4
    }
  },
  {
    "id": "ex-1271",
    "name": "Chest and front of shoulder stretch",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1271-Uto7l43.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 7
    }
  },
  {
    "id": "ex-0251",
    "name": "Chest dip",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0251-9WTm7dq.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 7
    }
  },
  {
    "id": "ex-1430",
    "name": "Chest dip (on dip-pull-up cage)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1430-XgWyAiA.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 7
    }
  },
  {
    "id": "ex-2462",
    "name": "Chest dip on straight bar",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2462-LQFOrMn.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1272",
    "name": "Chest stretch with exercise ball",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1272-ykA5tU7.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 6
    }
  },
  {
    "id": "ex-3216",
    "name": "Chest tap push-up (male)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3216-7E06s6d.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1326",
    "name": "Chin-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1326-T2mxWqc.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 8,
      "espalda_alta": 7,
      "antebrazos": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0253",
    "name": "Chin-ups (narrow parallel grip)",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0253-G70mEAJ.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 8,
      "antebrazos": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0257",
    "name": "Circles knee stretch",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0257-X7jbxra.gif",
    "synergists": {
      "gemelos": 6,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-1273",
    "name": "Clap push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1273-wigSg76.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0258",
    "name": "Clock push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0258-CMAxnsG.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 7,
      "triceps": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1327",
    "name": "Close grip chin-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1327-VnfUNW7.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 8,
      "espalda_alta": 7,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0259",
    "name": "Close-grip push-up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0259-x6KpKpq.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-2398",
    "name": "Close-grip push-up (on knees)",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2398-v3vLFW0.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 6,
      "hombros": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0260",
    "name": "Cocoons",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0260-SLKj2pX.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-1468",
    "name": "Crab twist toe touch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1468-xgsGFVM.gif",
    "synergists": {
      "abdominales": 8,
      "gluteos": 5,
      "hombros": 5,
      "triceps": 4
    }
  },
  {
    "id": "ex-0262",
    "name": "Cross body crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0262-rbu5UUb.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0267",
    "name": "Crunch (hands overhead)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0267-kjJ3VoQ.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 3
    }
  },
  {
    "id": "ex-0271",
    "name": "Crunch (on stability ball)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0271-MCUhf1F.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0272",
    "name": "Crunch (on stability ball, arms straight)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0272-Sn8wxAI.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 3
    }
  },
  {
    "id": "ex-0274",
    "name": "Crunch floor",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0274-TFqbd8t.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3016",
    "name": "Curl-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3016-g2oKspu.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3769",
    "name": "Curtsey squat",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3769-gUjqdei.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "aductores": 7,
      "abductores": 6
    }
  },
  {
    "id": "ex-2331",
    "name": "Cycle cross trainer",
    "muscle": "cardio",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2331-XSCHmiI.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 6,
      "gluteos": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0276",
    "name": "Dead bug",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0276-iny3m5y.gif",
    "synergists": {
      "abdominales": 8,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0277",
    "name": "Decline crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0277-9Ap7miY.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 1
    }
  },
  {
    "id": "ex-0279",
    "name": "Decline push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0279-i5cEhka.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 7,
      "triceps": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0282",
    "name": "Decline sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0282-QLL2gdc.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-1274",
    "name": "Deep push up",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1274-vptOQ4N.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0283",
    "name": "Diamond push-up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0283-soIB2rj.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0284",
    "name": "Donkey calf raise",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0284-u5ESqzH.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 1
    }
  },
  {
    "id": "ex-1275",
    "name": "Drop push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1275-Q497lAE.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0285",
    "name": "Dumbbell alternate biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0285-BU15nH4.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-2403",
    "name": "Dumbbell alternate biceps curl (with arm blaster)",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2403-CfKsRbG.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1646",
    "name": "Dumbbell alternate hammer preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1646-fy7Tgy4.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1647",
    "name": "Dumbbell alternate preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1647-NlfIbzq.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1648",
    "name": "Dumbbell alternate seated hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1648-6em2Dxj.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-0286",
    "name": "Dumbbell alternate side press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0286-izMnLqz.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-1649",
    "name": "Dumbbell alternating bicep curl with leg raised on exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1649-Zwiw7XR.gif",
    "synergists": {
      "biceps": 8,
      "abdominales": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1650",
    "name": "Dumbbell alternating seated bicep curl on exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1650-J74XlNf.gif",
    "synergists": {
      "biceps": 8,
      "abdominales": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-2137",
    "name": "Dumbbell arnold press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2137-Xy4jlWA.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "pecho": 4
    }
  },
  {
    "id": "ex-0287",
    "name": "Dumbbell arnold press v. 2",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0287-eOrFCnx.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "pecho": 4
    }
  },
  {
    "id": "ex-0288",
    "name": "Dumbbell around pullover",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0288-vi8EhoE.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 7,
      "triceps": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0289",
    "name": "Dumbbell bench press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0289-SpYC0Kp.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0290",
    "name": "Dumbbell bench seated press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0290-3d7wHyd.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0291",
    "name": "Dumbbell bench squat",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0291-mnzcrIB.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 5
    }
  },
  {
    "id": "ex-0293",
    "name": "Dumbbell bent over row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0293-BJ0Hz5L.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1651",
    "name": "Dumbbell bicep curl lunge with bowling motion",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1651-1VpF8db.gif",
    "synergists": {
      "biceps": 8,
      "gluteos": 7,
      "cuadriceps": 7,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1652",
    "name": "Dumbbell bicep curl on exercise ball with leg raised",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1652-2NImIAG.gif",
    "synergists": {
      "biceps": 8,
      "abdominales": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1653",
    "name": "Dumbbell bicep curl with stork stance",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1653-uSkDMYl.gif",
    "synergists": {
      "biceps": 8,
      "abdominales": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0294",
    "name": "Dumbbell biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0294-NbVPDMW.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-2401",
    "name": "Dumbbell biceps curl (with arm blaster)",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2401-nlJsbkW.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1654",
    "name": "Dumbbell biceps curl reverse",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1654-nFc4FyV.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-1655",
    "name": "Dumbbell biceps curl squat",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1655-niXESDw.gif",
    "synergists": {
      "biceps": 8,
      "cuadriceps": 8,
      "gluteos": 7
    }
  },
  {
    "id": "ex-1656",
    "name": "Dumbbell biceps curl v sit on bosu ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1656-H1XAdpk.gif",
    "synergists": {
      "biceps": 8,
      "abdominales": 8
    }
  },
  {
    "id": "ex-1201",
    "name": "Dumbbell burpee",
    "muscle": "cardio",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1201-0JtKWum.gif",
    "synergists": {
      "cardio": 9,
      "cuadriceps": 7,
      "pecho": 6,
      "hombros": 6,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0295",
    "name": "Dumbbell clean",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0295-7Hg55JG.gif",
    "synergists": {
      "gluteos": 8,
      "cuadriceps": 7,
      "femorales": 7,
      "hombros": 6,
      "trapecios": 6
    }
  },
  {
    "id": "ex-1731",
    "name": "Dumbbell close grip press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1731-7jGOBF3.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0296",
    "name": "Dumbbell close-grip press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0296-RxayqAZ.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0297",
    "name": "Dumbbell concentration curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0297-gvsWLQw.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-3635",
    "name": "Dumbbell contralateral forward lunge",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3635-ecl28tP.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 9,
      "femorales": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0298",
    "name": "Dumbbell cross body hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0298-Qyk5J3p.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1657",
    "name": "Dumbbell cross body hammer curl v. 2",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1657-HDYiZcY.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-0299",
    "name": "Dumbbell cuban press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0299-QfAKy1G.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-2136",
    "name": "Dumbbell cuban press v. 2",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2136-BqgCRif.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0300",
    "name": "Dumbbell deadlift",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0300-nUwVh7b.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 7,
      "cuadriceps": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0301",
    "name": "Dumbbell decline bench press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0301-DwhEmmE.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0302",
    "name": "Dumbbell decline fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0302-xXm4nYq.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 4
    }
  },
  {
    "id": "ex-0303",
    "name": "Dumbbell decline hammer press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0303-1qrWgZ2.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-1276",
    "name": "Dumbbell decline one arm fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1276-NL6YBwN.gif",
    "synergists": {
      "pecho": 9,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-1617",
    "name": "Dumbbell decline one arm hammer press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1617-SHUMp5H.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 8,
      "hombros": 5
    }
  },
  {
    "id": "ex-0305",
    "name": "Dumbbell decline shrug",
    "muscle": "trapecios",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0305-cwsAI4G.gif",
    "synergists": {
      "trapecios": 9,
      "espalda_alta": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0304",
    "name": "Dumbbell decline shrug v. 2",
    "muscle": "trapecios",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0304-bRlbdjK.gif",
    "synergists": {
      "trapecios": 9,
      "espalda_alta": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0306",
    "name": "Dumbbell decline triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0306-OTgkHwR.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0307",
    "name": "Dumbbell decline twist fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0307-reFHapa.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 4,
      "triceps": 3
    }
  },
  {
    "id": "ex-1437",
    "name": "Dumbbell finger curls",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1437-mtXengz.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 2
    }
  },
  {
    "id": "ex-0308",
    "name": "Dumbbell fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0308-yz9nUhF.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-1277",
    "name": "Dumbbell fly on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1277-Lt3iWnf.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1732",
    "name": "Dumbbell forward lunge triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1732-XalXcvM.gif",
    "synergists": {
      "triceps": 8,
      "cuadriceps": 7,
      "gluteos": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0310",
    "name": "Dumbbell front raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0310-3eGE2JC.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4,
      "trapecios": 3
    }
  },
  {
    "id": "ex-0309",
    "name": "Dumbbell front raise v. 2",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0309-Rr7S3yg.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4,
      "trapecios": 3
    }
  },
  {
    "id": "ex-0311",
    "name": "Dumbbell full can lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0311-AQ0mC4Y.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-1760",
    "name": "Dumbbell goblet squat",
    "muscle": "cuadriceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1760-yn8yg1r.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 7,
      "aductores": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0313",
    "name": "Dumbbell hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0313-slDvUAU.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-1659",
    "name": "Dumbbell hammer curl on exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1659-fY68AyX.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0312",
    "name": "Dumbbell hammer curl v. 2",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0312-2NpxjC1.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-2402",
    "name": "Dumbbell hammer curls (with arm blaster)",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2402-GNhAeJ0.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-1664",
    "name": "Dumbbell high curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1664-qAmNMJY.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-3545",
    "name": "Dumbbell incline alternate press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3545-TVdivgY.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0314",
    "name": "Dumbbell incline bench press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0314-ns0SIbU.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0315",
    "name": "Dumbbell incline biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0315-F3xgbjF.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0316",
    "name": "Dumbbell incline breeding",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0316-B3Rxp6L.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-0318",
    "name": "Dumbbell incline curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0318-ae9UoXQ.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0317",
    "name": "Dumbbell incline curl v. 2",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0317-RaflbWD.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0319",
    "name": "Dumbbell incline fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0319-ESOd5Pl.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-1278",
    "name": "Dumbbell incline fly on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1278-HYe1ZqR.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0320",
    "name": "Dumbbell incline hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0320-ByX0WxV.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0321",
    "name": "Dumbbell incline hammer press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0321-PG1kcIb.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-1618",
    "name": "Dumbbell incline hammer press on exercise ball",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1618-wkgnGfb.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 8,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0322",
    "name": "Dumbbell incline inner biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0322-LCtQPn8.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1279",
    "name": "Dumbbell incline one arm fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1279-Gw2HFvW.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1280",
    "name": "Dumbbell incline one arm fly on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1280-LLNh6q5.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1619",
    "name": "Dumbbell incline one arm hammer press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1619-LL1UiTX.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 8,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1620",
    "name": "Dumbbell incline one arm hammer press on exercise ball",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1620-jDnrkar.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 8,
      "hombros": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0323",
    "name": "Dumbbell incline one arm lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0323-aTNKZiC.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4
    }
  },
  {
    "id": "ex-1281",
    "name": "Dumbbell incline one arm press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1281-rDAiRf9.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1282",
    "name": "Dumbbell incline one arm press on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1282-Bg5JKSH.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0324",
    "name": "Dumbbell incline palm-in press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0324-OVLmUuL.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-1283",
    "name": "Dumbbell incline press on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1283-bfiHMpI.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0325",
    "name": "Dumbbell incline raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0325-nxW6BkN.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0326",
    "name": "Dumbbell incline rear lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0326-vYk8lqw.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0327",
    "name": "Dumbbell incline row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0327-7vG5o25.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "hombros": 4
    }
  },
  {
    "id": "ex-0328",
    "name": "Dumbbell incline shoulder raise",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0328-6e2DcYX.gif",
    "synergists": {
      "hombros": 8,
      "pecho": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0329",
    "name": "Dumbbell incline shrug",
    "muscle": "trapecios",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0329-JymLInS.gif",
    "synergists": {
      "trapecios": 9,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-3542",
    "name": "Dumbbell incline t-raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3542-jgbvVJ0.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0330",
    "name": "Dumbbell incline triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0330-OVIKwsd.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0331",
    "name": "Dumbbell incline twisted flyes",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0331-1PLE8e9.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-1733",
    "name": "Dumbbell incline two arm extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1733-U7D9Fx3.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-3541",
    "name": "Dumbbell incline y-raise",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3541-PbzNu7c.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 8,
      "trapecios": 6
    }
  },
  {
    "id": "ex-0332",
    "name": "Dumbbell iron cross",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0332-cALkHHX.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0333",
    "name": "Dumbbell kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0333-W6PxUkg.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1734",
    "name": "Dumbbell kickbacks on exercise ball",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1734-cAvTaSg.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-1660",
    "name": "Dumbbell kneeling bicep curl exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1660-2JCuFTU.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0334",
    "name": "Dumbbell lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0334-DsgkuIt.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 4,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0335",
    "name": "Dumbbell lateral to front raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0335-xMjBKwn.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 4,
      "pecho": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0336",
    "name": "Dumbbell lunge",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0336-RRWFUcw.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 6,
      "aductores": 4,
      "gemelos": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1658",
    "name": "Dumbbell lunge with bicep curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1658-Mz6lLcW.gif",
    "synergists": {
      "cuadriceps": 8,
      "biceps": 8,
      "gluteos": 7,
      "femorales": 5,
      "antebrazos": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0337",
    "name": "Dumbbell lying extension (across face)",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0337-L2V5Nan.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-1729",
    "name": "Dumbbell lying alternate extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1729-NfP83rA.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 2
    }
  },
  {
    "id": "ex-0338",
    "name": "Dumbbell lying elbow press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0338-eOCOwIR.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 6,
      "hombros": 4
    }
  },
  {
    "id": "ex-0863",
    "name": "Dumbbell lying external shoulder rotation",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0863-bmBf7LN.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-0339",
    "name": "Dumbbell lying femoral",
    "muscle": "femorales",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0339-FkBIE6a.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 4,
      "gemelos": 3
    }
  },
  {
    "id": "ex-0340",
    "name": "Dumbbell lying hammer press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0340-7gdLIXa.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-2470",
    "name": "Dumbbell lying on floor rear delt raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2470-Ion0XWz.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0341",
    "name": "Dumbbell lying one arm deltoid rear",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0341-gSw59a4.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0343",
    "name": "Dumbbell lying one arm press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0343-zGSIWQi.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0342",
    "name": "Dumbbell lying one arm press v. 2",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0342-K3dIO25.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0344",
    "name": "Dumbbell lying one arm pronated triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0344-wyaqzOS.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3,
      "hombros": 2
    }
  },
  {
    "id": "ex-0345",
    "name": "Dumbbell lying one arm rear lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0345-KwFGiEP.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0346",
    "name": "Dumbbell lying one arm supinated triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0346-zZlORz6.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3,
      "hombros": 2
    }
  },
  {
    "id": "ex-0347",
    "name": "Dumbbell lying pronation",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0347-mym4hJo.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-2705",
    "name": "Dumbbell lying pronation on floor",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2705-7RWNjiB.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1284",
    "name": "Dumbbell lying pullover on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1284-iK59oEA.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 7,
      "triceps": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1328",
    "name": "Dumbbell lying rear delt row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1328-XUUD0Fs.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 4
    }
  },
  {
    "id": "ex-0348",
    "name": "Dumbbell lying rear lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0348-53Ttlck.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-1735",
    "name": "Dumbbell lying single extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1735-6MfS53i.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3
    }
  },
  {
    "id": "ex-0349",
    "name": "Dumbbell lying supination",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0349-M2Pm3zj.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 4
    }
  },
  {
    "id": "ex-2706",
    "name": "Dumbbell lying supination on floor",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2706-rEhi2o5.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 4
    }
  },
  {
    "id": "ex-1661",
    "name": "Dumbbell lying supine biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1661-XVzF3iZ.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0350",
    "name": "Dumbbell lying supine curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0350-KUaZst7.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0351",
    "name": "Dumbbell lying triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0351-mpKZGWz.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1662",
    "name": "Dumbbell lying wide curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1662-qm9veZw.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0352",
    "name": "Dumbbell neutral grip bench press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0352-pP8wP2P.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 8,
      "hombros": 5
    }
  },
  {
    "id": "ex-1285",
    "name": "Dumbbell one arm bench fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1285-o5Jsk92.gif",
    "synergists": {
      "pecho": 9,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-0292",
    "name": "Dumbbell one arm bent-over row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0292-C0MA9bC.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "biceps": 5,
      "antebrazos": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-1286",
    "name": "Dumbbell one arm chest fly on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1286-Bpkf41o.gif",
    "synergists": {
      "pecho": 9,
      "abdominales": 6,
      "hombros": 4
    }
  },
  {
    "id": "ex-0353",
    "name": "Dumbbell one arm concentration curl (on stability ball)",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0353-k5IpyHg.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1287",
    "name": "Dumbbell one arm decline chest press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1287-REGM1dE.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 6,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-1288",
    "name": "Dumbbell one arm fly on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1288-Am02iPd.gif",
    "synergists": {
      "pecho": 9,
      "abdominales": 6,
      "hombros": 4
    }
  },
  {
    "id": "ex-1736",
    "name": "Dumbbell one arm french press on exercise ball",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1736-ziFKQXP.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-1663",
    "name": "Dumbbell one arm hammer preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1663-4dF3maG.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1621",
    "name": "Dumbbell one arm hammer press on exercise ball",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1621-VYmYxK5.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 6,
      "hombros": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1289",
    "name": "Dumbbell one arm incline chest press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1289-PDaMuyV.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0354",
    "name": "Dumbbell one arm kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0354-bQy2Eni.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0355",
    "name": "Dumbbell one arm lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0355-n5cWCsI.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0356",
    "name": "Dumbbell one arm lateral raise with support",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0356-Yg7MJAT.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 3
    }
  },
  {
    "id": "ex-1290",
    "name": "Dumbbell one arm press on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1290-QZFv5ui.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "abdominales": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-1665",
    "name": "Dumbbell one arm prone curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1665-JWjujiY.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1666",
    "name": "Dumbbell one arm prone hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1666-LIGZSTA.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1291",
    "name": "Dumbbell one arm pullover on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1291-bQHPBU3.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 7,
      "abdominales": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-0358",
    "name": "Dumbbell one arm reverse wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0358-BwSNDGt.gif",
    "synergists": {
      "antebrazos": 10,
      "biceps": 2
    }
  },
  {
    "id": "ex-0359",
    "name": "Dumbbell one arm reverse fly (with support)",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0359-e25F58f.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-1622",
    "name": "Dumbbell one arm reverse grip press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1622-Ze7MoIb.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 6
    }
  },
  {
    "id": "ex-1414",
    "name": "Dumbbell one arm reverse preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1414-bWxq4op.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-1667",
    "name": "Dumbbell one arm reverse spider curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1667-VdLZ3nB.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-1668",
    "name": "Dumbbell one arm seated bicep curl on exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1668-s999Hdo.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1669",
    "name": "Dumbbell one arm seated hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1669-jK2hZ6n.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-1415",
    "name": "Dumbbell one arm seated neutral wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1415-YtaCTYl.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 3
    }
  },
  {
    "id": "ex-0361",
    "name": "Dumbbell one arm shoulder press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0361-84RyJf8.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "abdominales": 4,
      "pecho": 3
    }
  },
  {
    "id": "ex-0360",
    "name": "Dumbbell one arm shoulder press v. 2",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0360-1TkiAFK.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3888",
    "name": "Dumbbell one arm snatch",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3888-6pTkI99.gif",
    "synergists": {
      "gluteos": 8,
      "cuadriceps": 7,
      "hombros": 7,
      "femorales": 6,
      "lumbares": 6,
      "trapecios": 5,
      "cardio": 5
    }
  },
  {
    "id": "ex-1670",
    "name": "Dumbbell one arm standing curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1670-ffQsyBj.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4,
      "abdominales": 2
    }
  },
  {
    "id": "ex-1671",
    "name": "Dumbbell one arm standing hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1671-2sQGZ5b.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0362",
    "name": "Dumbbell one arm triceps extension (on bench)",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0362-nAuHPcD.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 2
    }
  },
  {
    "id": "ex-0363",
    "name": "Dumbbell one arm upright row",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0363-6cKQC5E.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 8,
      "biceps": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0364",
    "name": "Dumbbell one arm wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0364-q8aHNoF.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1672",
    "name": "Dumbbell one arm zottman preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1672-sxY5Biu.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1292",
    "name": "Dumbbell one leg fly on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1292-pH2x2jj.gif",
    "synergists": {
      "pecho": 9,
      "abdominales": 6,
      "hombros": 5,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0365",
    "name": "Dumbbell over bench neutral wrist curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0365-BKa8dmT.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 3
    }
  },
  {
    "id": "ex-0366",
    "name": "Dumbbell over bench one arm neutral wrist curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0366-IvV6C9M.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 3
    }
  },
  {
    "id": "ex-1441",
    "name": "Dumbbell over bench one arm reverse wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1441-4Jc36XM.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0367",
    "name": "Dumbbell over bench one arm wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0367-KI1DjNN.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0368",
    "name": "Dumbbell over bench revers wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0368-3tAXPQ6.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0369",
    "name": "Dumbbell over bench wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0369-D1xYJAU.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1329",
    "name": "Dumbbell palm rotational bent over row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1329-wt6rwjk.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 6,
      "antebrazos": 4,
      "lumbares": 4
    }
  },
  {
    "id": "ex-1623",
    "name": "Dumbbell palms in incline bench press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1623-8eqjhOl.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 6
    }
  },
  {
    "id": "ex-0370",
    "name": "Dumbbell peacher hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0370-F1KxjBa.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0371",
    "name": "Dumbbell plyo squat",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0371-S4pwGlc.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "cardio": 6,
      "femorales": 5,
      "gemelos": 5
    }
  },
  {
    "id": "ex-0372",
    "name": "Dumbbell preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0372-jivWf8n.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1673",
    "name": "Dumbbell preacher curl over exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1673-hwygydB.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1293",
    "name": "Dumbbell press on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1293-O8o7q4d.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0373",
    "name": "Dumbbell pronate-grip triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0373-bpJL2Qs.gif",
    "synergists": {
      "triceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0374",
    "name": "Dumbbell prone incline curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0374-mwpPcr1.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1674",
    "name": "Dumbbell prone incline hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1674-cWemPG8.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0375",
    "name": "Dumbbell pullover",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0375-9XjtHvS.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 8,
      "triceps": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1294",
    "name": "Dumbbell pullover hip extension on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1294-lI7easp.gif",
    "synergists": {
      "gluteos": 8,
      "pecho": 7,
      "dorsales": 7,
      "femorales": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1295",
    "name": "Dumbbell pullover on exercise ball",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1295-FSD6PGL.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 8,
      "triceps": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1700",
    "name": "Dumbbell push press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1700-FS63wTN.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "cuadriceps": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0376",
    "name": "Dumbbell raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0376-c9MnDRp.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 4
    }
  },
  {
    "id": "ex-2292",
    "name": "Dumbbell rear delt raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2292-mu5Guxt.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0377",
    "name": "Dumbbell rear delt row_shoulder",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0377-EKXOMEh.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 4
    }
  },
  {
    "id": "ex-0378",
    "name": "Dumbbell rear fly",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0378-8DiFDVA.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0380",
    "name": "Dumbbell rear lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0380-v1qBec9.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0379",
    "name": "Dumbbell rear lateral raise (support head)",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0379-UzkLrem.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0381",
    "name": "Dumbbell rear lunge",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0381-SSsBDwB.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "femorales": 6,
      "aductores": 4
    }
  },
  {
    "id": "ex-0382",
    "name": "Dumbbell revers grip biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0382-e4ojVhP.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-1624",
    "name": "Dumbbell reverse bench press",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1624-UIbGx6H.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 6
    }
  },
  {
    "id": "ex-0383",
    "name": "Dumbbell reverse fly",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0383-EAs3xL9.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-1330",
    "name": "Dumbbell reverse grip incline bench one arm row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1330-ZIViNh1.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "biceps": 7,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1331",
    "name": "Dumbbell reverse grip incline bench two arm row",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1331-9pQSkH8.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "biceps": 7,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-2327",
    "name": "Dumbbell reverse grip row (female)",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2327-Nh3mvOO.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "antebrazos": 6,
      "trapecios": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0384",
    "name": "Dumbbell reverse preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0384-O8Aq69u.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-1675",
    "name": "Dumbbell reverse spider curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1675-6sMAmNv.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-0385",
    "name": "Dumbbell reverse wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0385-BLCvwr2.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1459",
    "name": "Dumbbell romanian deadlift",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1459-rR0LJzx.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 9,
      "lumbares": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0386",
    "name": "Dumbbell rotation reverse fly",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0386-prbWx1D.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-2397",
    "name": "Dumbbell scott press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2397-5vfAI0I.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 5,
      "pecho": 3
    }
  },
  {
    "id": "ex-0387",
    "name": "Dumbbell seated alternate front raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0387-gH5fRsC.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4,
      "trapecios": 3
    }
  },
  {
    "id": "ex-1676",
    "name": "Dumbbell seated alternate hammer curl on exercise ball",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1676-QLRmNeT.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0388",
    "name": "Dumbbell seated alternate press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0388-QT5Q0nK.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-3546",
    "name": "Dumbbell seated alternate shoulder",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3546-q7qkONO.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0389",
    "name": "Dumbbell seated bench extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0389-JhYSVwT.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-2317",
    "name": "Dumbbell seated bent arm lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2317-JzQbv7J.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 5
    }
  },
  {
    "id": "ex-1730",
    "name": "Dumbbell seated bent over alternate kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1730-x0lwvfq.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "lumbares": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1737",
    "name": "Dumbbell seated bent over triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1737-4ievMJ9.gif",
    "synergists": {
      "triceps": 9,
      "lumbares": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-1677",
    "name": "Dumbbell seated bicep curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1677-xiA6lRr.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0390",
    "name": "Dumbbell seated biceps curl (on stability ball)",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0390-WgJnBH5.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3547",
    "name": "Dumbbell seated biceps curl to shoulder press",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3547-OeL23VY.gif",
    "synergists": {
      "biceps": 8,
      "hombros": 8,
      "triceps": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1379",
    "name": "Dumbbell seated calf raise",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1379-r29jP7S.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0391",
    "name": "Dumbbell seated curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0391-TiaZTxx.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0392",
    "name": "Dumbbell seated front raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0392-Ys97II0.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 4
    }
  },
  {
    "id": "ex-1678",
    "name": "Dumbbell seated hammer curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1678-IGtBdNT.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 8
    }
  },
  {
    "id": "ex-0393",
    "name": "Dumbbell seated inner biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0393-KXyoEtA.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0394",
    "name": "Dumbbell seated kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0394-en550rk.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0396",
    "name": "Dumbbell seated lateral raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0396-hxyTtWj.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0395",
    "name": "Dumbbell seated lateral raise v. 2",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0395-hrrS0Ed.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0397",
    "name": "Dumbbell seated neutral wrist curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0397-uJmK7Z1.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 4
    }
  },
  {
    "id": "ex-1679",
    "name": "Dumbbell seated one arm bicep curl on exercise ball with leg raised",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1679-84sESNy.gif",
    "synergists": {
      "biceps": 9,
      "abdominales": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0398",
    "name": "Dumbbell seated one arm kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0398-VQ3sNCn.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0399",
    "name": "Dumbbell seated one arm rotate",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0399-7f2jsqP.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0400",
    "name": "Dumbbell seated one leg calf raise",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0400-Ia7tumC.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1380",
    "name": "Dumbbell seated one leg calf raise - hammer grip",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1380-FxhcxUW.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1381",
    "name": "Dumbbell seated one leg calf raise - palm up",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1381-VW88JNd.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0401",
    "name": "Dumbbell seated palms up wrist curl",
    "muscle": "antebrazos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0401-2dImyQ8.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0402",
    "name": "Dumbbell seated preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0402-7D5bgLT.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0403",
    "name": "Dumbbell seated revers grip concentration curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0403-lyKCLmK.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-1738",
    "name": "Dumbbell seated reverse grip one arm overhead tricep extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1738-5fKX7wi.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0405",
    "name": "Dumbbell seated shoulder press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0405-znQUdHY.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0404",
    "name": "Dumbbell seated shoulder press (parallel grip)",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0404-f1jf47L.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "pecho": 4,
      "trapecios": 4
    }
  },
  {
    "id": "ex-2188",
    "name": "Dumbbell seated triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2188-kont8Ut.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0406",
    "name": "Dumbbell shrug",
    "muscle": "trapecios",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0406-NJzBsGJ.gif",
    "synergists": {
      "trapecios": 10,
      "antebrazos": 5,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0407",
    "name": "Dumbbell side bend",
    "muscle": "abdominales",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0407-IpONWYv.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0408",
    "name": "Dumbbell side lying one hand raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0408-fTlkJop.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4
    }
  },
  {
    "id": "ex-3664",
    "name": "Dumbbell side plank with rear fly",
    "muscle": "espalda_alta",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3664-X6ytgYZ.gif",
    "synergists": {
      "abdominales": 8,
      "espalda_alta": 8,
      "hombros": 8,
      "gluteos": 4
    }
  },
  {
    "id": "ex-3548",
    "name": "Dumbbell single arm overhead carry",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3548-mWBtgmb.gif",
    "synergists": {
      "hombros": 8,
      "abdominales": 8,
      "trapecios": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-0409",
    "name": "Dumbbell single leg calf raise",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0409-1kB3Wmk.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1757",
    "name": "Dumbbell single leg deadlift",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1757-gKozT8X.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-2805",
    "name": "Dumbbell single leg deadlift with stepbox support",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2805-daBmy1Y.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0410",
    "name": "Dumbbell single leg split squat",
    "muscle": "cuadriceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0410-qx4fgX7.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 5,
      "aductores": 4
    }
  },
  {
    "id": "ex-0411",
    "name": "Dumbbell single leg squat",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0411-H6ybluc.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 9,
      "femorales": 5,
      "aductores": 4
    }
  },
  {
    "id": "ex-0413",
    "name": "Dumbbell squat",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0413-HsvHqgf.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "lumbares": 5,
      "aductores": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3560",
    "name": "Dumbbell standing alternate hammer curl and press",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3560-LeaZOIz.gif",
    "synergists": {
      "biceps": 8,
      "hombros": 8,
      "antebrazos": 6,
      "triceps": 5,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0414",
    "name": "Dumbbell standing alternate overhead press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0414-bBi35y3.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0415",
    "name": "Dumbbell standing alternate raise",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0415-SxHteRW.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 4,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1739",
    "name": "Dumbbell standing alternating tricep kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1739-Gi2BXfK.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-2143",
    "name": "Dumbbell standing around world",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2143-RSOsp5d.gif",
    "synergists": {
      "hombros": 8,
      "pecho": 6,
      "trapecios": 5,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-1740",
    "name": "Dumbbell standing bent over one arm triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1740-CJwa0vD.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-1741",
    "name": "Dumbbell standing bent over two arm triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1741-3T12T87.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "lumbares": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0416",
    "name": "Dumbbell standing biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0416-3s4NnTh.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6,
      "hombros": 3
    }
  },
  {
    "id": "ex-0417",
    "name": "Dumbbell standing calf raise",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0417-dPmaUaU.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0418",
    "name": "Dumbbell standing concentration curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0418-7inpWch.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0419",
    "name": "Dumbbell standing front raise above head",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0419-laVRfDf.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 6,
      "pecho": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-2321",
    "name": "Dumbbell standing inner biceps curl v. 2",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2321-vKilzz3.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0420",
    "name": "Dumbbell standing kickback",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0420-UmpPAAe.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "lumbares": 3
    }
  },
  {
    "id": "ex-0421",
    "name": "Dumbbell standing one arm concentration curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0421-8fgqP5a.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0422",
    "name": "Dumbbell standing one arm curl (over incline bench)",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0422-BIb1tGo.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1680",
    "name": "Dumbbell standing one arm curl over incline bench",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1680-EmlJR2y.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0423",
    "name": "Dumbbell standing one arm extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0423-BCUR88E.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0424",
    "name": "Dumbbell standing one arm palm in press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0424-ocYc6Db.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0425",
    "name": "Dumbbell standing one arm reverse curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0425-DU5Kkj2.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7,
      "hombros": 3
    }
  },
  {
    "id": "ex-0426",
    "name": "Dumbbell standing overhead press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0426-A6wtbuL.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0427",
    "name": "Dumbbell standing palms in press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0427-UilDHSs.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "pecho": 4,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0428",
    "name": "Dumbbell standing preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0428-hq2hyDH.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0429",
    "name": "Dumbbell standing reverse curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0429-0IgNjSM.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7,
      "hombros": 3
    }
  },
  {
    "id": "ex-0430",
    "name": "Dumbbell standing triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0430-PdmaD0N.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3,
      "abdominales": 3
    }
  },
  {
    "id": "ex-2293",
    "name": "Dumbbell standing zottman preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2293-P2nRiUa.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-1684",
    "name": "Dumbbell step up single leg balance with bicep curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1684-76vfTdU.gif",
    "synergists": {
      "cuadriceps": 7,
      "gluteos": 7,
      "biceps": 7,
      "abdominales": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0431",
    "name": "Dumbbell step-up",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0431-aXtJhlg.gif",
    "synergists": {
      "gluteos": 8,
      "cuadriceps": 8,
      "femorales": 4,
      "gemelos": 4
    }
  },
  {
    "id": "ex-2796",
    "name": "Dumbbell step-up lunge",
    "muscle": "cuadriceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2796-gFyFj9z.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-2812",
    "name": "Dumbbell step-up split squat",
    "muscle": "cuadriceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2812-QjE2DcA.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0432",
    "name": "Dumbbell stiff leg deadlift",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0432-5eLRITT.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 8,
      "lumbares": 6,
      "dorsales": 4
    }
  },
  {
    "id": "ex-0433",
    "name": "Dumbbell straight arm pullover",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0433-i8BdLTK.gif",
    "synergists": {
      "pecho": 8,
      "dorsales": 8,
      "triceps": 5,
      "hombros": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0434",
    "name": "Dumbbell straight leg deadlift",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0434-oom75KC.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 8,
      "lumbares": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-2808",
    "name": "Dumbbell sumo pull through",
    "muscle": "gluteos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2808-BmrwWzo.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 7,
      "aductores": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-2803",
    "name": "Dumbbell supported squat",
    "muscle": "cuadriceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2803-r5DgrW9.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 7,
      "aductores": 4
    }
  },
  {
    "id": "ex-0436",
    "name": "Dumbbell tate press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0436-s5PdDyY.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "pecho": 3
    }
  },
  {
    "id": "ex-1742",
    "name": "Dumbbell tricep kickback with stork stance",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1742-wOLmCXc.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "abdominales": 4,
      "gluteos": 3
    }
  },
  {
    "id": "ex-1743",
    "name": "Dumbbell twisting bench press",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1743-z6TAHoT.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0437",
    "name": "Dumbbell upright row",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0437-ainizkb.gif",
    "synergists": {
      "hombros": 8,
      "trapecios": 8,
      "biceps": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1765",
    "name": "Dumbbell upright row (back pov)",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1765-Iptlv6x.gif",
    "synergists": {
      "trapecios": 8,
      "hombros": 8,
      "espalda_alta": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-0864",
    "name": "Dumbbell upright shoulder external rotation",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0864-x306lCW.gif",
    "synergists": {
      "hombros": 9,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-5201",
    "name": "Dumbbell waiter biceps curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/5201-KOpzGBL.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6,
      "hombros": 3
    }
  },
  {
    "id": "ex-0438",
    "name": "Dumbbell w-press",
    "muscle": "hombros",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0438-vmwLyCg.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0439",
    "name": "Dumbbell zottman curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0439-kXaIn5A.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8,
      "hombros": 3
    }
  },
  {
    "id": "ex-2294",
    "name": "Dumbbell zottman preacher curl",
    "muscle": "biceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2294-y5U5B9Y.gif",
    "synergists": {
      "biceps": 8,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-2189",
    "name": "Dumbbells seated triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2189-FQXdXzY.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 3
    }
  },
  {
    "id": "ex-1167",
    "name": "Dynamic chest stretch (male)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1167-3uj0Ozg.gif",
    "synergists": {
      "pecho": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-3287",
    "name": "Elbow dips",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3287-LkoAWAE.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-1772",
    "name": "Elbow lift - reverse push-up",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1772-wbUYILZ.gif",
    "synergists": {
      "espalda_alta": 8,
      "trapecios": 7,
      "hombros": 6,
      "dorsales": 5
    }
  },
  {
    "id": "ex-0443",
    "name": "Elbow-to-knee",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0443-jvp6DiD.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 3,
      "cardio": 3
    }
  },
  {
    "id": "ex-3292",
    "name": "Elevator",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3292-zYmNaoY.gif",
    "synergists": {
      "espalda_alta": 8,
      "abdominales": 7,
      "hombros": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-1332",
    "name": "Exercise ball alternating arm ups",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1332-EyLrNC2.gif",
    "synergists": {
      "dorsales": 7,
      "hombros": 6,
      "espalda_alta": 6,
      "lumbares": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1333",
    "name": "Exercise ball back extension with arms extended",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1333-PERjVm8.gif",
    "synergists": {
      "lumbares": 8,
      "gluteos": 6,
      "femorales": 5,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-1334",
    "name": "Exercise ball back extension with hands behind head",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1334-o1HGDSq.gif",
    "synergists": {
      "lumbares": 8,
      "gluteos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-1335",
    "name": "Exercise ball back extension with knees off ground",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1335-WME869U.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-1336",
    "name": "Exercise ball back extension with rotation",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1336-WVD66ff.gif",
    "synergists": {
      "lumbares": 8,
      "abdominales": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-1744",
    "name": "Exercise ball dip",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1744-kprile3.gif",
    "synergists": {
      "triceps": 8,
      "pecho": 6,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1559",
    "name": "Exercise ball hip flexor stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1559-2LQkNPW.gif",
    "synergists": {
      "gluteos": 4,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-1338",
    "name": "Exercise ball hug",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1338-d7z1Y7V.gif",
    "synergists": {
      "lumbares": 4,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-1339",
    "name": "Exercise ball lat stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1339-sM84pE4.gif",
    "synergists": {
      "dorsales": 4,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-1341",
    "name": "Exercise ball lower back stretch (pyramid)",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1341-yU7w7CA.gif",
    "synergists": {
      "lumbares": 4,
      "dorsales": 4,
      "femorales": 3
    }
  },
  {
    "id": "ex-1342",
    "name": "Exercise ball lying side lat stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1342-rTbyBYV.gif",
    "synergists": {
      "dorsales": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1382",
    "name": "Exercise ball on the wall calf raise",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1382-xo6sENf.gif",
    "synergists": {
      "gemelos": 8,
      "cuadriceps": 4,
      "gluteos": 3
    }
  },
  {
    "id": "ex-3241",
    "name": "Exercise ball on the wall calf raise (tennis ball between ankles)",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3241-FY3UdNT.gif",
    "synergists": {
      "gemelos": 8,
      "aductores": 5,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-3240",
    "name": "Exercise ball on the wall calf raise (tennis ball between knees)",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3240-j74M6Zn.gif",
    "synergists": {
      "gemelos": 8,
      "aductores": 6,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-1416",
    "name": "Exercise ball one leg prone lower body rotation",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1416-M72BExt.gif",
    "synergists": {
      "gluteos": 7,
      "abdominales": 7,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1417",
    "name": "Exercise ball one legged diagonal kick hamstring curl",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1417-GOJKFfO.gif",
    "synergists": {
      "femorales": 8,
      "gluteos": 8,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1296",
    "name": "Exercise ball pike push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1296-sVvXT5J.gif",
    "synergists": {
      "hombros": 9,
      "pecho": 7,
      "triceps": 7,
      "abdominales": 7
    }
  },
  {
    "id": "ex-1343",
    "name": "Exercise ball prone leg raise",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1343-lCKm4Rs.gif",
    "synergists": {
      "gluteos": 8,
      "lumbares": 8,
      "femorales": 6
    }
  },
  {
    "id": "ex-1560",
    "name": "Exercise ball seated hamstring stretch",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1560-yRYyfdA.gif",
    "synergists": {
      "femorales": 4,
      "gluteos": 3
    }
  },
  {
    "id": "ex-1745",
    "name": "Exercise ball seated triceps stretch",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1745-7ePTw4B.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 2,
      "dorsales": 1
    }
  },
  {
    "id": "ex-1746",
    "name": "Exercise ball supine triceps extension",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1746-Gm2Uv1z.gif",
    "synergists": {
      "triceps": 8,
      "hombros": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1747",
    "name": "Ez bar french press on exercise ball",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1747-CFN9P8G.gif",
    "synergists": {
      "triceps": 9,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-3010",
    "name": "Ez bar lying bent arms pullover",
    "muscle": "dorsales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3010-nDK1HJ0.gif",
    "synergists": {
      "dorsales": 8,
      "pecho": 6,
      "triceps": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-1748",
    "name": "Ez bar lying close grip triceps extension behind head",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1748-6CKUx7o.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1344",
    "name": "Ez bar reverse grip bent over row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1344-G8dXpNG.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 7,
      "lumbares": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1682",
    "name": "Ez bar seated close grip concentration curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1682-Dsfz0Id.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1749",
    "name": "Ez bar standing french press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1749-1cTf2Ux.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0445",
    "name": "Ez barbell anti gravity press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0445-fprd84i.gif",
    "synergists": {
      "hombros": 8,
      "triceps": 7,
      "espalda_alta": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-1627",
    "name": "Ez barbell close grip preacher curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1627-hacCyUv.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0446",
    "name": "Ez barbell close-grip curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0446-V4ryaZa.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0447",
    "name": "Ez barbell curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0447-6TG6x2w.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0448",
    "name": "Ez barbell decline close grip face press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0448-DgZQ11d.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 5,
      "hombros": 5
    }
  },
  {
    "id": "ex-2186",
    "name": "Ez barbell decline triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2186-CQHoDm0.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4
    }
  },
  {
    "id": "ex-0449",
    "name": "Ez barbell incline triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0449-KyLtiLT.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 5
    }
  },
  {
    "id": "ex-0450",
    "name": "Ez barbell jm bench press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0450-hnOYgH3.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0451",
    "name": "Ez barbell reverse grip curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0451-Y5X65IB.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-0452",
    "name": "Ez barbell reverse grip preacher curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0452-vBNyir7.gif",
    "synergists": {
      "antebrazos": 8,
      "biceps": 7
    }
  },
  {
    "id": "ex-1458",
    "name": "Ez barbell seated curls",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1458-jtFKbt5.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0453",
    "name": "Ez barbell seated triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0453-iaapw0g.gif",
    "synergists": {
      "triceps": 9,
      "hombros": 4
    }
  },
  {
    "id": "ex-0454",
    "name": "Ez barbell spider curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0454-Ye5Qxb0.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1628",
    "name": "Ez barbell spider curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1628-2kattbR.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-2404",
    "name": "Ez-bar biceps curl (with arm blaster)",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2404-tJ5nYqo.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-2432",
    "name": "Ez-bar close-grip bench press",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2432-da4cXST.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-2741",
    "name": "Ez-barbell standing wide grip biceps curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2741-OVTZ65k.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-2133",
    "name": "Farmers walk",
    "muscle": "cuadriceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2133-qPEzJjA.gif",
    "synergists": {
      "antebrazos": 9,
      "trapecios": 8,
      "abdominales": 7,
      "cuadriceps": 6,
      "lumbares": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0455",
    "name": "Finger curls",
    "muscle": "antebrazos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0455-awG04cF.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-3303",
    "name": "Flag",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3303-pQ0Mx1Z.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 8,
      "dorsales": 7,
      "espalda_alta": 7,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0456",
    "name": "Flexion leg sit up (bent knee)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0456-AR0ig3o.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-0457",
    "name": "Flexion leg sit up (straight arm)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0457-KZn52RC.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 4,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-0458",
    "name": "Floor fly (with barbell)",
    "muscle": "pecho",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0458-neonEDL.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 5,
      "triceps": 3
    }
  },
  {
    "id": "ex-0459",
    "name": "Flutter kicks",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0459-UVo2Qs2.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 5,
      "gluteos": 3
    }
  },
  {
    "id": "ex-1472",
    "name": "Forward jump",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1472-uZKq7lo.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "gemelos": 6,
      "femorales": 5,
      "cardio": 5
    }
  },
  {
    "id": "ex-3470",
    "name": "Forward lunge (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3470-kMzUs9Y.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-3194",
    "name": "Frankenstein squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3194-bdWcbaU.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 7,
      "abdominales": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-2429",
    "name": "Frog crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2429-FFRP97T.gif",
    "synergists": {
      "abdominales": 9,
      "aductores": 4
    }
  },
  {
    "id": "ex-3301",
    "name": "Frog planche",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3301-rQhGcin.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "abdominales": 7,
      "pecho": 5
    }
  },
  {
    "id": "ex-3296",
    "name": "Front lever",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3296-PkCN2lv.gif",
    "synergists": {
      "dorsales": 10,
      "abdominales": 9,
      "espalda_alta": 8,
      "hombros": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-3295",
    "name": "Front lever reps",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3295-hbY9wqG.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 9,
      "abdominales": 8,
      "hombros": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0464",
    "name": "Front plank with twist",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0464-CosupLu.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 4,
      "lumbares": 4
    }
  },
  {
    "id": "ex-3315",
    "name": "Full maltese",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3315-YRaCa5Y.gif",
    "synergists": {
      "hombros": 10,
      "pecho": 9,
      "abdominales": 8,
      "biceps": 7,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-3299",
    "name": "Full planche",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3299-YZ4961r.gif",
    "synergists": {
      "hombros": 10,
      "pecho": 8,
      "triceps": 8,
      "abdominales": 8,
      "lumbares": 6
    }
  },
  {
    "id": "ex-3327",
    "name": "Full planche push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3327-gw9PqGk.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 10,
      "triceps": 9,
      "abdominales": 8
    }
  },
  {
    "id": "ex-0466",
    "name": "Gironda sternum chin",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0466-IL0JUxR.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 9,
      "biceps": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-3561",
    "name": "Glute bridge march",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3561-GibBPPg.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 7,
      "lumbares": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3523",
    "name": "Glute bridge two legs on bench (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3523-aWedzZX.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 5
    }
  },
  {
    "id": "ex-3193",
    "name": "Glute-ham raise",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3193-Vvwjz6N.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 8,
      "gemelos": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0467",
    "name": "Gorilla chin",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0467-bmwlYvD.gif",
    "synergists": {
      "abdominales": 8,
      "biceps": 8,
      "dorsales": 8
    }
  },
  {
    "id": "ex-0469",
    "name": "Groin crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0469-mWppALS.gif",
    "synergists": {
      "abdominales": 9,
      "aductores": 6
    }
  },
  {
    "id": "ex-1383",
    "name": "Hack calf raise",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1383-2ORFMoR.gif",
    "synergists": {
      "gemelos": 10,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-1384",
    "name": "Hack one leg calf raise",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1384-AxFoqAD.gif",
    "synergists": {
      "gemelos": 10,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-3221",
    "name": "Half knee bends (male)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3221-ia6kIIl.gif",
    "synergists": {
      "cuadriceps": 8,
      "gluteos": 6,
      "cardio": 5
    }
  },
  {
    "id": "ex-3202",
    "name": "Half sit-up (male)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3202-iQ241UP.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-1511",
    "name": "Hamstring stretch",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1511-99rWm7w.gif",
    "synergists": {
      "femorales": 6,
      "gluteos": 3
    }
  },
  {
    "id": "ex-2139",
    "name": "Hands bike",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2139-pAIWRGu.gif",
    "synergists": {
      "cardio": 9,
      "hombros": 6,
      "triceps": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-3218",
    "name": "Hands clasped circular toe touch (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3218-B5xca8s.gif",
    "synergists": {
      "lumbares": 7,
      "femorales": 6,
      "abdominales": 5,
      "gluteos": 5
    }
  },
  {
    "id": "ex-3215",
    "name": "Hands reversed clasped circular toe touch (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3215-yq3GAJX.gif",
    "synergists": {
      "lumbares": 7,
      "femorales": 6,
      "abdominales": 5,
      "gluteos": 5
    }
  },
  {
    "id": "ex-3302",
    "name": "Handstand",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3302-XooAdhl.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 8,
      "trapecios": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0471",
    "name": "Handstand push-up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0471-rQxwMxO.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 9,
      "trapecios": 8,
      "pecho": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1764",
    "name": "Hanging leg hip raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1764-VEcJRo2.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0472",
    "name": "Hanging leg raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0472-I3tsCnC.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1761",
    "name": "Hanging oblique knee raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1761-BaE7O6U.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0473",
    "name": "Hanging pike",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0473-nuBF9MO.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0474",
    "name": "Hanging straight leg hip raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0474-pj0X0tF.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0475",
    "name": "Hanging straight leg raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0475-4Ml7QFO.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0476",
    "name": "Hanging straight twisting leg hip raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0476-Q6bvyen.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-3636",
    "name": "High knee against wall",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3636-ealLwvX.gif",
    "synergists": {
      "cardio": 9,
      "cuadriceps": 7,
      "abdominales": 6,
      "gemelos": 5
    }
  },
  {
    "id": "ex-0484",
    "name": "Hip raise (bent knee)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0484-196HJGw.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 1
    }
  },
  {
    "id": "ex-1418",
    "name": "Hug keens to chest",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1418-znP9SIh.gif",
    "synergists": {
      "gluteos": 5,
      "femorales": 4
    }
  },
  {
    "id": "ex-3234",
    "name": "Hyght dumbbell fly",
    "muscle": "pecho",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3234-P9ZRyLT.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6
    }
  },
  {
    "id": "ex-0489",
    "name": "Hyperextension",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0489-zhMwOwE.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-0488",
    "name": "Hyperextension (on bench)",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0488-zkgRrbK.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-3289",
    "name": "Impossible dips",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3289-05Cf2v8.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 8,
      "pecho": 7
    }
  },
  {
    "id": "ex-1471",
    "name": "Inchworm",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1471-ZgsNQ6d.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 6,
      "femorales": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-3698",
    "name": "Inchworm v. 2",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3698-TV87DNB.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 6,
      "femorales": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-0490",
    "name": "Incline close-grip push-up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0490-1YB40kg.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 6
    }
  },
  {
    "id": "ex-0491",
    "name": "Incline leg hip raise (leg straight)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0491-eVxAzgz.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-0492",
    "name": "Incline push up depth jump",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0492-CB8WET1.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0493",
    "name": "Incline push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0493-B1EVP9F.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-3785",
    "name": "Incline push-up (on box)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3785-F7vjXqT.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-0494",
    "name": "Incline reverse grip push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0494-XaaRnRn.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3011",
    "name": "Incline scapula push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3011-GdMa1ET.gif",
    "synergists": {
      "espalda_alta": 7,
      "pecho": 5,
      "hombros": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0495",
    "name": "Incline twisting sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0495-9ZGZuOD.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-1564",
    "name": "Intermediate hip flexor and quad stretch",
    "muscle": "cuadriceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1564-tFGKm99.gif",
    "synergists": {
      "cuadriceps": 8,
      "gluteos": 3,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0496",
    "name": "Inverse leg curl (bench support)",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0496-ms7tjSG.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 7,
      "lumbares": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-2400",
    "name": "Inverse leg curl (on pull-up cable machine)",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2400-0rHfvy9.gif",
    "synergists": {
      "femorales": 9,
      "gluteos": 6,
      "lumbares": 4,
      "gemelos": 3
    }
  },
  {
    "id": "ex-0499",
    "name": "Inverted row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0499-bZGHsAZ.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-2300",
    "name": "Inverted row bent knees",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2300-VPPtusI.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-2298",
    "name": "Inverted row on bench",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2298-Mxa7Cr8.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0497",
    "name": "Inverted row v. 2",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0497-uX3sUBz.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0498",
    "name": "Inverted row with straps",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0498-jdiExfW.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1419",
    "name": "Iron cross stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1419-pZwUsKB.gif",
    "synergists": {
      "gluteos": 7,
      "lumbares": 6,
      "femorales": 4
    }
  },
  {
    "id": "ex-1297",
    "name": "Isometric chest squeeze",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1297-HbSG1Pw.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 4,
      "biceps": 3
    }
  },
  {
    "id": "ex-0500",
    "name": "Isometric wipers",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0500-11wrviz.gif",
    "synergists": {
      "abdominales": 8,
      "pecho": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-0501",
    "name": "Jack burpee",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0501-mr7pkqP.gif",
    "synergists": {
      "cardio": 9,
      "cuadriceps": 7,
      "pecho": 6,
      "hombros": 5,
      "abdominales": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-3224",
    "name": "Jack jump (male)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3224-1g5bPpA.gif",
    "synergists": {
      "cardio": 9,
      "gemelos": 6,
      "cuadriceps": 5,
      "abductores": 4
    }
  },
  {
    "id": "ex-0507",
    "name": "Jackknife sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0507-mbkgB44.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-0508",
    "name": "Janda sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0508-1GPHRyK.gif",
    "synergists": {
      "abdominales": 10,
      "femorales": 4
    }
  },
  {
    "id": "ex-2612",
    "name": "Jump rope",
    "muscle": "cardio",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2612-e1e76I2.gif",
    "synergists": {
      "cardio": 9,
      "gemelos": 8,
      "antebrazos": 4,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-0514",
    "name": "Jump squat",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0514-LIlE5Tn.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "gemelos": 7,
      "cardio": 6
    }
  },
  {
    "id": "ex-0513",
    "name": "Jump squat v. 2",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0513-TDYiji6.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "gemelos": 7,
      "cardio": 6
    }
  },
  {
    "id": "ex-0517",
    "name": "Kettlebell advanced windmill",
    "muscle": "abdominales",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0517-Kal9cQQ.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 7,
      "lumbares": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0518",
    "name": "Kettlebell alternating hang clean",
    "muscle": "antebrazos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0518-I4tibZG.gif",
    "synergists": {
      "antebrazos": 7,
      "femorales": 7,
      "gluteos": 7,
      "trapecios": 6,
      "hombros": 5,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-0520",
    "name": "Kettlebell alternating press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0520-5KLbZWx.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "abdominales": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-0519",
    "name": "Kettlebell alternating press on floor",
    "muscle": "pecho",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0519-7w6i0vE.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0521",
    "name": "Kettlebell alternating renegade row",
    "muscle": "espalda_alta",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0521-b9kqlBy.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "abdominales": 8,
      "triceps": 5,
      "hombros": 5
    }
  },
  {
    "id": "ex-0522",
    "name": "Kettlebell alternating row",
    "muscle": "espalda_alta",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0522-Ca76jUE.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0523",
    "name": "Kettlebell arnold press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0523-UM8mgyG.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0524",
    "name": "Kettlebell bent press",
    "muscle": "abdominales",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0524-kjE55n5.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 8,
      "lumbares": 7,
      "triceps": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0525",
    "name": "Kettlebell bottoms up clean from the hang position",
    "muscle": "biceps",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0525-4KJEpzb.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7,
      "hombros": 6,
      "trapecios": 5,
      "femorales": 5
    }
  },
  {
    "id": "ex-0526",
    "name": "Kettlebell double alternating hang clean",
    "muscle": "biceps",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0526-a4F9Oyc.gif",
    "synergists": {
      "femorales": 7,
      "gluteos": 7,
      "antebrazos": 7,
      "biceps": 6,
      "trapecios": 6
    }
  },
  {
    "id": "ex-0527",
    "name": "Kettlebell double jerk",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0527-tznL2Ad.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 8,
      "cuadriceps": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0528",
    "name": "Kettlebell double push press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0528-I4KkPdl.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "cuadriceps": 7,
      "gluteos": 6
    }
  },
  {
    "id": "ex-0529",
    "name": "Kettlebell double snatch",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0529-M74kdvm.gif",
    "synergists": {
      "hombros": 8,
      "femorales": 8,
      "gluteos": 8,
      "trapecios": 7,
      "lumbares": 6,
      "cardio": 6
    }
  },
  {
    "id": "ex-0530",
    "name": "Kettlebell double windmill",
    "muscle": "abdominales",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0530-OaE7CpD.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 8,
      "lumbares": 7,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0531",
    "name": "Kettlebell extended range one arm press on floor",
    "muscle": "pecho",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0531-rseLfH3.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0532",
    "name": "Kettlebell figure 8",
    "muscle": "abdominales",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0532-L4ay0PW.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 6,
      "gluteos": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0533",
    "name": "Kettlebell front squat",
    "muscle": "gluteos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0533-DB0n8AG.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "abdominales": 6,
      "aductores": 5
    }
  },
  {
    "id": "ex-0534",
    "name": "Kettlebell goblet squat",
    "muscle": "gluteos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0534-ZA8b5hc.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "abdominales": 6,
      "aductores": 5
    }
  },
  {
    "id": "ex-0535",
    "name": "Kettlebell hang clean",
    "muscle": "femorales",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0535-LHWF7us.gif",
    "synergists": {
      "femorales": 8,
      "gluteos": 8,
      "trapecios": 7,
      "antebrazos": 6,
      "lumbares": 6
    }
  },
  {
    "id": "ex-0536",
    "name": "Kettlebell lunge pass through",
    "muscle": "gluteos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0536-WKMQzCD.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "abdominales": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0537",
    "name": "Kettlebell one arm clean and jerk",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0537-vzAxBtt.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "femorales": 7,
      "gluteos": 7,
      "trapecios": 6,
      "cuadriceps": 6
    }
  },
  {
    "id": "ex-1298",
    "name": "Kettlebell one arm floor press",
    "muscle": "pecho",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1298-rg59QCH.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 6,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0538",
    "name": "Kettlebell one arm jerk",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0538-S37C94C.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "cuadriceps": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0539",
    "name": "Kettlebell one arm military press to the side",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0539-yCvYdi7.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "abdominales": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0540",
    "name": "Kettlebell one arm push press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0540-osdXT3K.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "cuadriceps": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0541",
    "name": "Kettlebell one arm row",
    "muscle": "espalda_alta",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0541-g9AsZ8P.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 8,
      "biceps": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0542",
    "name": "Kettlebell one arm snatch",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0542-aXcUyKb.gif",
    "synergists": {
      "hombros": 8,
      "femorales": 8,
      "gluteos": 8,
      "trapecios": 7,
      "lumbares": 6,
      "cardio": 5
    }
  },
  {
    "id": "ex-0543",
    "name": "Kettlebell pirate supper legs",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0543-kuXhl0o.gif",
    "synergists": {
      "hombros": 7,
      "cuadriceps": 7,
      "gluteos": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0544",
    "name": "Kettlebell pistol squat",
    "muscle": "gluteos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0544-5bpPTHv.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 9,
      "gemelos": 6,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0545",
    "name": "Kettlebell plyo push-up",
    "muscle": "pecho",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0545-ktf3nvW.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0546",
    "name": "Kettlebell seated press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0546-BkxB8LW.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1438",
    "name": "Kettlebell seated two arm military press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1438-ZEkjZDi.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0547",
    "name": "Kettlebell seesaw press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0547-UDm6cGl.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "abdominales": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0548",
    "name": "Kettlebell sumo high pull",
    "muscle": "trapecios",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0548-8ARQ9Hw.gif",
    "synergists": {
      "trapecios": 9,
      "hombros": 8,
      "gluteos": 7,
      "cuadriceps": 6,
      "femorales": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0549",
    "name": "Kettlebell swing",
    "muscle": "gluteos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0549-UHJlbu3.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 7,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-0550",
    "name": "Kettlebell thruster",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0550-yWxMvB5.gif",
    "synergists": {
      "hombros": 9,
      "cuadriceps": 9,
      "gluteos": 8,
      "triceps": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0551",
    "name": "Kettlebell turkish get up (squat style)",
    "muscle": "gluteos",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0551-Ha7SZ3y.gif",
    "synergists": {
      "gluteos": 8,
      "hombros": 8,
      "abdominales": 8,
      "cuadriceps": 7,
      "triceps": 6,
      "lumbares": 6
    }
  },
  {
    "id": "ex-0552",
    "name": "Kettlebell two arm clean",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0552-7Ba7bQ2.gif",
    "synergists": {
      "trapecios": 8,
      "hombros": 7,
      "gluteos": 7,
      "femorales": 6,
      "antebrazos": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-0553",
    "name": "Kettlebell two arm military press",
    "muscle": "hombros",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0553-blBXysN.gif",
    "synergists": {
      "hombros": 9,
      "triceps": 7,
      "trapecios": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1345",
    "name": "Kettlebell two arm row",
    "muscle": "espalda_alta",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1345-wf24o8S.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 7,
      "hombros": 5,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0554",
    "name": "Kettlebell windmill",
    "muscle": "abdominales",
    "equipment": "kettlebell",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0554-9Tkqa9O.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 7,
      "gluteos": 6,
      "femorales": 6,
      "lumbares": 6
    }
  },
  {
    "id": "ex-0555",
    "name": "Kick out sit",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0555-v7p5bYl.gif",
    "synergists": {
      "femorales": 7,
      "abdominales": 8,
      "cuadriceps": 7,
      "gluteos": 6,
      "cardio": 6
    }
  },
  {
    "id": "ex-0558",
    "name": "Kipping muscle up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0558-pM07UxU.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "triceps": 8,
      "pecho": 7,
      "hombros": 7,
      "biceps": 6,
      "abdominales": 6
    }
  },
  {
    "id": "ex-3640",
    "name": "Knee touch crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3640-dTg95eZ.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-1420",
    "name": "Kneeling jump squat",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1420-UgDm3oy.gif",
    "synergists": {
      "gluteos": 9,
      "cuadriceps": 8,
      "femorales": 7,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1346",
    "name": "Kneeling lat stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1346-f38OEuO.gif",
    "synergists": {
      "dorsales": 6,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-3239",
    "name": "Kneeling plank tap shoulder (male)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3239-h1ezqSu.gif",
    "synergists": {
      "abdominales": 8,
      "hombros": 6,
      "pecho": 4,
      "triceps": 4
    }
  },
  {
    "id": "ex-3211",
    "name": "Kneeling push-up (male)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3211-ZOuKWir.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 6,
      "hombros": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3288",
    "name": "Korean dips",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3288-rWoBmi5.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 8,
      "abdominales": 5
    }
  },
  {
    "id": "ex-3418",
    "name": "L-pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3418-d1GgzTU.gif",
    "synergists": {
      "dorsales": 9,
      "abdominales": 9,
      "espalda_alta": 8,
      "biceps": 7,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-3419",
    "name": "L-sit on floor",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3419-UpWmA5E.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 7,
      "triceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0562",
    "name": "Landmine 180",
    "muscle": "abdominales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0562-QYysSLV.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 7,
      "pecho": 5,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3237",
    "name": "Landmine lateral raise",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3237-eXMFHww.gif",
    "synergists": {
      "hombros": 9,
      "trapecios": 6,
      "antebrazos": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3300",
    "name": "Lean planche",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3300-LYJodFS.gif",
    "synergists": {
      "hombros": 9,
      "abdominales": 9,
      "pecho": 7,
      "triceps": 7,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-2271",
    "name": "Left hook. boxing",
    "muscle": "hombros",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2271-hoXt6wv.gif",
    "synergists": {
      "hombros": 8,
      "abdominales": 7,
      "pecho": 6,
      "cardio": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0570",
    "name": "Leg pull in flat bench",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0570-OyoZ3Pu.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-1576",
    "name": "Leg up hamstring stretch",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1576-sU5BrfP.gif",
    "synergists": {
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-2287",
    "name": "Lever alternate leg press",
    "muscle": "cuadriceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2287-V07qpXy.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 7,
      "femorales": 5
    }
  },
  {
    "id": "ex-0571",
    "name": "Lever alternating narrow grip seated row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0571-w2oRpuH.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0572",
    "name": "Lever assisted chin-up",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0572-MaMuGH6.gif",
    "synergists": {
      "dorsales": 8,
      "biceps": 7,
      "espalda_alta": 7,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0573",
    "name": "Lever back extension",
    "muscle": "lumbares",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0573-rUXfn3R.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 7,
      "femorales": 7
    }
  },
  {
    "id": "ex-0574",
    "name": "Lever bent over row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0574-X3cqyXz.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 7,
      "lumbares": 5
    }
  },
  {
    "id": "ex-3200",
    "name": "Lever bent-over row with v-bar",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3200-LuBEORI.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 7,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0575",
    "name": "Lever bicep curl",
    "muscle": "biceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0575-q6y3OhV.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-2289",
    "name": "Lever calf press",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2289-7B4F5nZ.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0577",
    "name": "Lever chest press",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0577-T0yTjgW.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0576",
    "name": "Lever chest press",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0576-DOoWcnA.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-0578",
    "name": "Lever deadlift",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0578-GUT8I22.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 8,
      "cuadriceps": 6,
      "trapecios": 5,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1300",
    "name": "Lever decline chest press",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1300-vsVoPHt.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-1253",
    "name": "Lever donkey calf raise",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1253-C9LuR4A.gif",
    "synergists": {
      "gemelos": 9,
      "femorales": 4
    }
  },
  {
    "id": "ex-0579",
    "name": "Lever front pulldown",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0579-7F1DVzn.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 7,
      "biceps": 6,
      "pecho": 4
    }
  },
  {
    "id": "ex-0580",
    "name": "Lever gripless shrug",
    "muscle": "trapecios",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0580-f91FwXG.gif",
    "synergists": {
      "trapecios": 10,
      "espalda_alta": 3,
      "hombros": 2
    }
  },
  {
    "id": "ex-1439",
    "name": "Lever gripless shrug v. 2",
    "muscle": "trapecios",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1439-cbuFJrn.gif",
    "synergists": {
      "trapecios": 10,
      "espalda_alta": 3,
      "hombros": 2
    }
  },
  {
    "id": "ex-2288",
    "name": "Lever gripper hands",
    "muscle": "antebrazos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2288-mKwcrHn.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-1615",
    "name": "Lever hammer grip preacher curl",
    "muscle": "biceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1615-OAguZoG.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-0581",
    "name": "Lever high row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0581-nZZZy9m.gif",
    "synergists": {
      "espalda_alta": 9,
      "trapecios": 8,
      "hombros": 7,
      "biceps": 6
    }
  },
  {
    "id": "ex-2286",
    "name": "Lever hip extension v. 2",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2286-OPqShYN.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 7
    }
  },
  {
    "id": "ex-2611",
    "name": "Lever horizontal one leg press",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2611-9KU9TYF.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 8,
      "femorales": 6
    }
  },
  {
    "id": "ex-1299",
    "name": "Lever incline chest press",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1299-jHAnWmT.gif",
    "synergists": {
      "pecho": 9,
      "hombros": 7,
      "triceps": 6
    }
  },
  {
    "id": "ex-1479",
    "name": "Lever incline chest press v. 2",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1479-o17Jfkt.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "triceps": 6
    }
  },
  {
    "id": "ex-0582",
    "name": "Lever kneeling leg curl",
    "muscle": "femorales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0582-nnmCTLN.gif",
    "synergists": {
      "femorales": 10,
      "gemelos": 3,
      "gluteos": 3
    }
  },
  {
    "id": "ex-0583",
    "name": "Lever kneeling twist",
    "muscle": "abdominales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0583-sZOR9EV.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 2
    }
  },
  {
    "id": "ex-0584",
    "name": "Lever lateral raise",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0584-dRTfGZT.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0585",
    "name": "Lever leg extension",
    "muscle": "cuadriceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0585-my33uHU.gif",
    "synergists": {
      "cuadriceps": 10
    }
  },
  {
    "id": "ex-0586",
    "name": "Lever lying leg curl",
    "muscle": "femorales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0586-17lJ1kr.gif",
    "synergists": {
      "femorales": 10,
      "gemelos": 3,
      "gluteos": 2
    }
  },
  {
    "id": "ex-3195",
    "name": "Lever lying two-one leg curl",
    "muscle": "femorales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3195-UXpKJoq.gif",
    "synergists": {
      "femorales": 10,
      "gemelos": 3,
      "gluteos": 2
    }
  },
  {
    "id": "ex-0587",
    "name": "Lever military press",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0587-CggQhII.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "trapecios": 4,
      "pecho": 3
    }
  },
  {
    "id": "ex-0588",
    "name": "Lever narrow grip seated row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0588-IGjKj1v.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 9,
      "biceps": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0589",
    "name": "Lever one arm bent over row",
    "muscle": "espalda_alta",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0589-Fhdtwf3.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "lumbares": 4
    }
  },
  {
    "id": "ex-1356",
    "name": "Lever one arm lateral high row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1356-OIFMAp1.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 5,
      "trapecios": 5
    }
  },
  {
    "id": "ex-1347",
    "name": "Lever one arm lateral wide pulldown",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1347-tTuZSDT.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 7,
      "biceps": 5
    }
  },
  {
    "id": "ex-0590",
    "name": "Lever one arm shoulder press",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0590-2KGnL6M.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0591",
    "name": "Lever overhand triceps dip",
    "muscle": "triceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0591-D5yqP2p.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0592",
    "name": "Lever preacher curl",
    "muscle": "biceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0592-b6hQYMb.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1614",
    "name": "Lever preacher curl v. 2",
    "muscle": "biceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1614-ye84CTU.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-2285",
    "name": "Lever pullover",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2285-4U7iLb5.gif",
    "synergists": {
      "dorsales": 10,
      "pecho": 5,
      "triceps": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-2736",
    "name": "Lever reverse grip lateral pulldown",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2736-ky8FLU8.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 7,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-1616",
    "name": "Lever reverse grip preacher curl",
    "muscle": "biceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1616-kj3hy6W.gif",
    "synergists": {
      "antebrazos": 9,
      "biceps": 7
    }
  },
  {
    "id": "ex-1348",
    "name": "Lever reverse grip vertical row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1348-ZqNOWQ6.gif",
    "synergists": {
      "espalda_alta": 9,
      "biceps": 7,
      "dorsales": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0593",
    "name": "Lever reverse hyperextension",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0593-Krmb3cB.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 7,
      "lumbares": 6
    }
  },
  {
    "id": "ex-1349",
    "name": "Lever reverse t-bar row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1349-BgljGjd.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "hombros": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-2315",
    "name": "Lever rotary calf",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2315-MrgP9L6.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-2335",
    "name": "Lever seated calf press",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2335-Ie9UGty.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0594",
    "name": "Lever seated calf raise",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0594-bOOdeyc.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1452",
    "name": "Lever seated crunch",
    "muscle": "abdominales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1452-Wgaz7pm.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0595",
    "name": "Lever seated crunch (chest pad)",
    "muscle": "abdominales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0595-ZnJHhMk.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3760",
    "name": "Lever seated crunch v. 2",
    "muscle": "abdominales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3760-eXFXCY0.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-1451",
    "name": "Lever seated dip",
    "muscle": "triceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1451-BRImeP8.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0596",
    "name": "Lever seated fly",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0596-v3xmPAR.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 4
    }
  },
  {
    "id": "ex-3759",
    "name": "Lever seated good morning",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3759-XsCcxCC.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 8,
      "femorales": 6
    }
  },
  {
    "id": "ex-0597",
    "name": "Lever seated hip abduction",
    "muscle": "abductores",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0597-CHpahtl.gif",
    "synergists": {
      "abductores": 10,
      "gluteos": 4
    }
  },
  {
    "id": "ex-0598",
    "name": "Lever seated hip adduction",
    "muscle": "aductores",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0598-oHsrypV.gif",
    "synergists": {
      "aductores": 10,
      "gluteos": 1
    }
  },
  {
    "id": "ex-0599",
    "name": "Lever seated leg curl",
    "muscle": "femorales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0599-Zg3XY7P.gif",
    "synergists": {
      "femorales": 10,
      "gemelos": 3
    }
  },
  {
    "id": "ex-0600",
    "name": "Lever seated leg raise crunch",
    "muscle": "abdominales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0600-PQ2AtC3.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-0602",
    "name": "Lever seated reverse fly",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0602-myfUsKf.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0601",
    "name": "Lever seated reverse fly (parallel grip)",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0601-xiHiJcA.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 7,
      "trapecios": 5
    }
  },
  {
    "id": "ex-1350",
    "name": "Lever seated row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1350-7I6LNUG.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 9,
      "biceps": 6
    }
  },
  {
    "id": "ex-1385",
    "name": "Lever seated squat calf raise on leg press machine",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1385-IeDEXTe.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0603",
    "name": "Lever shoulder press",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0603-67n3r98.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0869",
    "name": "Lever shoulder press v. 2",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0869-vqsbmL0.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-2318",
    "name": "Lever shoulder press v. 3",
    "muscle": "hombros",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2318-dNFYIU1.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-0604",
    "name": "Lever shrug",
    "muscle": "trapecios",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0604-ZZKbeMw.gif",
    "synergists": {
      "trapecios": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0605",
    "name": "Lever standing calf raise",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0605-ykUOVze.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-3758",
    "name": "Lever standing chest press",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3758-WbNq5Xu.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0606",
    "name": "Lever t bar row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0606-aaXr7ld.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1351",
    "name": "Lever t-bar reverse grip row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1351-FVM1AUZ.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 7,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0607",
    "name": "Lever triceps extension",
    "muscle": "triceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0607-Ser9eQp.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 1
    }
  },
  {
    "id": "ex-1313",
    "name": "Lever unilateral row",
    "muscle": "espalda_alta",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1313-oROuvrX.gif",
    "synergists": {
      "espalda_alta": 9,
      "dorsales": 8,
      "biceps": 6
    }
  },
  {
    "id": "ex-0609",
    "name": "London bridge",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0609-bLyQokI.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-3013",
    "name": "Low glute bridge on floor",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3013-u0cNiij.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 6,
      "lumbares": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1352",
    "name": "Lower back curl",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1352-ANbbry2.gif",
    "synergists": {
      "lumbares": 9,
      "gluteos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-3582",
    "name": "Lunge with jump",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3582-PM1PZjg.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 9,
      "cardio": 7,
      "femorales": 6,
      "gemelos": 5
    }
  },
  {
    "id": "ex-1688",
    "name": "Lunge with twist",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1688-K9VL0Jq.gif",
    "synergists": {
      "cuadriceps": 8,
      "gluteos": 8,
      "abdominales": 7,
      "femorales": 5
    }
  },
  {
    "id": "ex-0613",
    "name": "Lying (side) quads stretch",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0613-BWnJR72.gif",
    "synergists": {
      "cuadriceps": 10
    }
  },
  {
    "id": "ex-2312",
    "name": "Lying elbow to knee",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2312-AQIhRjM.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 4
    }
  },
  {
    "id": "ex-0620",
    "name": "Lying leg raise flat bench",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0620-WhuFnR7.gif",
    "synergists": {
      "abdominales": 9,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-0865",
    "name": "Lying leg-hip raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0865-9IxJdtC.gif",
    "synergists": {
      "abdominales": 9,
      "lumbares": 4
    }
  },
  {
    "id": "ex-1301",
    "name": "Machine inner chest press",
    "muscle": "pecho",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1301-wDN97Ca.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0624",
    "name": "March sit (wall)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0624-sVQCCeG.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 7,
      "gemelos": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1353",
    "name": "Medicine ball catch and overhead throw",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1353-PsVS1QP.gif",
    "synergists": {
      "hombros": 8,
      "dorsales": 7,
      "triceps": 7,
      "espalda_alta": 6,
      "abdominales": 5,
      "cardio": 5
    }
  },
  {
    "id": "ex-1302",
    "name": "Medicine ball chest pass",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1302-aDoFKrE.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-1303",
    "name": "Medicine ball chest push from 3 point stance",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1303-dCJnuVq.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1304",
    "name": "Medicine ball chest push multiple response",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1304-7aolH9D.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6,
      "cardio": 6
    }
  },
  {
    "id": "ex-1305",
    "name": "Medicine ball chest push single response",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1305-jeHtrlO.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-1312",
    "name": "Medicine ball chest push with run release",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1312-pX9Elbe.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 7,
      "hombros": 6,
      "cardio": 6,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-1701",
    "name": "Medicine ball close grip push up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1701-8K7m2SS.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 8,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1354",
    "name": "Medicine ball overhead slam",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1354-oHg8eop.gif",
    "synergists": {
      "dorsales": 8,
      "abdominales": 8,
      "espalda_alta": 7,
      "hombros": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-1750",
    "name": "Medicine ball supine chest throw",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1750-Al3tP0D.gif",
    "synergists": {
      "pecho": 8,
      "triceps": 8,
      "hombros": 5
    }
  },
  {
    "id": "ex-0627",
    "name": "Mixed grip chin-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0627-T8UpLkb.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 8,
      "espalda_alta": 7,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-3217",
    "name": "Modified hindu push-up (male)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3217-epOSYUZ.gif",
    "synergists": {
      "hombros": 8,
      "pecho": 8,
      "triceps": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1421",
    "name": "Modified push up to lower arms",
    "muscle": "antebrazos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1421-arvaszz.gif",
    "synergists": {
      "triceps": 8,
      "antebrazos": 8,
      "pecho": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0628",
    "name": "Monster walk",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0628-O95afRA.gif",
    "synergists": {
      "abductores": 9,
      "gluteos": 9,
      "cuadriceps": 6
    }
  },
  {
    "id": "ex-0630",
    "name": "Mountain climber",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0630-RJgzwny.gif",
    "synergists": {
      "cardio": 9,
      "abdominales": 8,
      "cuadriceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0631",
    "name": "Muscle up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0631-yJUHKTn.gif",
    "synergists": {
      "dorsales": 9,
      "triceps": 8,
      "pecho": 8,
      "hombros": 7,
      "biceps": 7,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-1401",
    "name": "Muscle-up (on vertical bar)",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1401-Af0EW2I.gif",
    "synergists": {
      "dorsales": 9,
      "triceps": 8,
      "pecho": 8,
      "hombros": 7,
      "biceps": 7,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-2328",
    "name": "Narrow push-up on exercise ball",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2328-4cWjYEN.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 6,
      "abdominales": 7
    }
  },
  {
    "id": "ex-1403",
    "name": "Neck side stretch",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1403-x2chWLO.gif",
    "synergists": {
      "trapecios": 7,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-0634",
    "name": "Negative crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0634-szIn2UK.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-1495",
    "name": "Oblique crunch v. 2",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1495-cJgSTmh.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0635",
    "name": "Oblique crunches floor",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0635-QUDd8WS.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0636",
    "name": "Olympic barbell hammer curl",
    "muscle": "biceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0636-o1ntciW.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 8
    }
  },
  {
    "id": "ex-0637",
    "name": "Olympic barbell triceps extension",
    "muscle": "triceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0637-wu5LXwz.gif",
    "synergists": {
      "triceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1355",
    "name": "One arm against wall",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1355-ZZTGMKh.gif",
    "synergists": {
      "dorsales": 7,
      "pecho": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0638",
    "name": "One arm chin-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0638-HjdqmZa.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 9,
      "antebrazos": 8,
      "espalda_alta": 8,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0639",
    "name": "One arm dip",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0639-FAoIFMw.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 8,
      "hombros": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0640",
    "name": "One arm slam (with medicine ball)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0640-jCrtE9b.gif",
    "synergists": {
      "abdominales": 8,
      "dorsales": 7,
      "hombros": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-1773",
    "name": "One arm towel row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1773-bKWbrTA.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "biceps": 7,
      "antebrazos": 7
    }
  },
  {
    "id": "ex-1386",
    "name": "One leg donkey calf raise",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1386-A2upspL.gif",
    "synergists": {
      "gemelos": 9,
      "femorales": 4
    }
  },
  {
    "id": "ex-1387",
    "name": "One leg floor calf raise",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1387-0jp9Rlz.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1476",
    "name": "One leg squat",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1476-C31LMnP.gif",
    "synergists": {
      "cuadriceps": 9,
      "gluteos": 9,
      "femorales": 6,
      "gemelos": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0641",
    "name": "Otis up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0641-UVL20oz.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-0642",
    "name": "Outside leg kick push-up",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0642-jNU1gFQ.gif",
    "synergists": {
      "gluteos": 7,
      "pecho": 7,
      "abductores": 6,
      "hombros": 6,
      "triceps": 6,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0643",
    "name": "Overhead triceps stretch",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0643-Z5YStHW.gif",
    "synergists": {
      "triceps": 10,
      "dorsales": 2,
      "hombros": 2
    }
  },
  {
    "id": "ex-3147",
    "name": "Pelvic tilt",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3147-NKJ8o6x.gif",
    "synergists": {
      "abdominales": 8,
      "gluteos": 5
    }
  },
  {
    "id": "ex-1422",
    "name": "Pelvic tilt into bridge",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1422-D9qe7CM.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 6,
      "abdominales": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1388",
    "name": "Peroneals stretch",
    "muscle": "gemelos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1388-XhfS1DZ.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-3662",
    "name": "Pike-to-cobra push-up",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3662-XPUDTt7.gif",
    "synergists": {
      "hombros": 8,
      "triceps": 7,
      "pecho": 7,
      "lumbares": 6,
      "abdominales": 6
    }
  },
  {
    "id": "ex-1306",
    "name": "Plyo push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1306-Snj1wSv.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1687",
    "name": "Posterior step to overhead reach",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1687-ErqK3UL.gif",
    "synergists": {
      "abdominales": 7,
      "cuadriceps": 6,
      "gluteos": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-1389",
    "name": "Posterior tibialis stretch",
    "muscle": "gemelos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1389-DEEqoI2.gif",
    "synergists": {
      "gemelos": 6,
      "femorales": 3
    }
  },
  {
    "id": "ex-3119",
    "name": "Potty squat",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3119-75Bgtjy.gif",
    "synergists": {
      "cuadriceps": 7,
      "gluteos": 6,
      "aductores": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3132",
    "name": "Potty squat with support",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3132-b63ZzGe.gif",
    "synergists": {
      "gluteos": 6,
      "cuadriceps": 6,
      "aductores": 5
    }
  },
  {
    "id": "ex-0648",
    "name": "Power clean",
    "muscle": "femorales",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0648-SiWCcTN.gif",
    "synergists": {
      "femorales": 8,
      "gluteos": 8,
      "cuadriceps": 8,
      "trapecios": 8,
      "lumbares": 7,
      "gemelos": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-3665",
    "name": "Power point plank",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3665-hCjGsRQ.gif",
    "synergists": {
      "abdominales": 9,
      "hombros": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-3203",
    "name": "Prisoner half sit-up (male)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3203-mgejmGP.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-1707",
    "name": "Prone twist on stability ball",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1707-1IG6gVF.gif",
    "synergists": {
      "abdominales": 8,
      "lumbares": 4,
      "hombros": 3
    }
  },
  {
    "id": "ex-0651",
    "name": "Pull up (neutral grip)",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0651-0V2YQjW.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 7,
      "espalda_alta": 7,
      "antebrazos": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-0650",
    "name": "Pull-in (on stability ball)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0650-UQr48Oi.gif",
    "synergists": {
      "abdominales": 8,
      "cuadriceps": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-0652",
    "name": "Pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0652-lBDjFxJ.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 7,
      "biceps": 6,
      "antebrazos": 5,
      "trapecios": 4
    }
  },
  {
    "id": "ex-1689",
    "name": "Push and pull bodyweight",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1689-wXvUZC8.gif",
    "synergists": {
      "pecho": 7,
      "espalda_alta": 7,
      "dorsales": 6,
      "hombros": 5,
      "triceps": 5,
      "biceps": 5
    }
  },
  {
    "id": "ex-3638",
    "name": "Push to run",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3638-PrQbjvB.gif",
    "synergists": {
      "cardio": 9,
      "cuadriceps": 8,
      "gluteos": 7,
      "gemelos": 6
    }
  },
  {
    "id": "ex-1307",
    "name": "Push up on bosu ball",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1307-wVompEp.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0662",
    "name": "Push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0662-I4hDWkc.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0653",
    "name": "Push-up (bosu ball)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0653-2kr2lWy.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0655",
    "name": "Push-up (on stability ball)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0655-Y4BRNQF.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0656",
    "name": "Push-up (on stability ball)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0656-tgryw5Y.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0659",
    "name": "Push-up (wall)",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0659-LEH9jxP.gif",
    "synergists": {
      "pecho": 5,
      "triceps": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-0658",
    "name": "Push-up (wall) v. 2",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0658-NCmbLCw.gif",
    "synergists": {
      "pecho": 5,
      "triceps": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-0660",
    "name": "Push-up close-grip off dumbbell",
    "muscle": "triceps",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0660-KZXAtKQ.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 7,
      "hombros": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0661",
    "name": "Push-up inside leg kick",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0661-0br45wL.gif",
    "synergists": {
      "gluteos": 7,
      "pecho": 7,
      "abdominales": 7,
      "triceps": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-0663",
    "name": "Push-up medicine ball",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0663-W8KAlkI.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-1467",
    "name": "Push-up on lower arms",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1467-4Jt8QsQ.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 5,
      "hombros": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-3145",
    "name": "Push-up plus",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3145-pvBMLHA.gif",
    "synergists": {
      "pecho": 7,
      "hombros": 7,
      "triceps": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0664",
    "name": "Push-up to side plank",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0664-KhHJ338.gif",
    "synergists": {
      "abdominales": 8,
      "pecho": 7,
      "hombros": 7,
      "triceps": 6
    }
  },
  {
    "id": "ex-3533",
    "name": "Quads",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3533-6YUfHPL.gif",
    "synergists": {
      "cuadriceps": 7,
      "femorales": 3
    }
  },
  {
    "id": "ex-3201",
    "name": "Quarter sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3201-enxnJcM.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3552",
    "name": "Quick feet v. 2",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3552-mweqJin.gif",
    "synergists": {
      "cardio": 9,
      "cuadriceps": 7,
      "gemelos": 7,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0666",
    "name": "Raise single arm push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0666-13TpY4H.gif",
    "synergists": {
      "pecho": 9,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 8
    }
  },
  {
    "id": "ex-0668",
    "name": "Rear decline bridge",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0668-UpAlold.gif",
    "synergists": {
      "gluteos": 9,
      "femorales": 8,
      "lumbares": 7
    }
  },
  {
    "id": "ex-0669",
    "name": "Rear deltoid stretch",
    "muscle": "hombros",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0669-xifhB5W.gif",
    "synergists": {
      "hombros": 5,
      "espalda_alta": 3
    }
  },
  {
    "id": "ex-0670",
    "name": "Rear pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0670-CbFSYC1.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-1582",
    "name": "Reclining big toe pose with rope",
    "muscle": "femorales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1582-K5xgdvI.gif",
    "synergists": {
      "femorales": 7,
      "gemelos": 4
    }
  },
  {
    "id": "ex-3236",
    "name": "Resistance band hip thrusts on knees (female)",
    "muscle": "gluteos",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3236-Pjbc0Kt.gif",
    "synergists": {
      "gluteos": 8,
      "femorales": 5,
      "lumbares": 4
    }
  },
  {
    "id": "ex-3007",
    "name": "Resistance band leg extension",
    "muscle": "cuadriceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3007-Y1MsI1l.gif",
    "synergists": {
      "cuadriceps": 10
    }
  },
  {
    "id": "ex-3123",
    "name": "Resistance band seated biceps curl",
    "muscle": "biceps",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3123-XFc3vpY.gif",
    "synergists": {
      "biceps": 9,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3124",
    "name": "Resistance band seated chest press",
    "muscle": "pecho",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3124-4x5Okof.gif",
    "synergists": {
      "pecho": 8,
      "hombros": 6,
      "triceps": 6
    }
  },
  {
    "id": "ex-3006",
    "name": "Resistance band seated hip abduction",
    "muscle": "abductores",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3006-0xDpB4L.gif",
    "synergists": {
      "abductores": 9,
      "gluteos": 7
    }
  },
  {
    "id": "ex-3122",
    "name": "Resistance band seated shoulder press",
    "muscle": "hombros",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3122-S93zLTG.gif",
    "synergists": {
      "hombros": 8,
      "triceps": 6,
      "trapecios": 4
    }
  },
  {
    "id": "ex-3144",
    "name": "Resistance band seated straight back row",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3144-Nu7jqFE.gif",
    "synergists": {
      "espalda_alta": 8,
      "dorsales": 7,
      "biceps": 6,
      "trapecios": 5
    }
  },
  {
    "id": "ex-0872",
    "name": "Reverse crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0872-nCU1Ekp.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0672",
    "name": "Reverse dip",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0672-NZ5Qqkz.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-0673",
    "name": "Reverse grip machine lat pulldown",
    "muscle": "dorsales",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0673-ecpY0rH.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 8,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-0674",
    "name": "Reverse grip pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0674-YAk5dIw.gif",
    "synergists": {
      "dorsales": 9,
      "biceps": 8,
      "espalda_alta": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0675",
    "name": "Reverse hyper extension (on stability ball)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0675-vM5YS2g.gif",
    "synergists": {
      "gluteos": 9,
      "lumbares": 8,
      "femorales": 7
    }
  },
  {
    "id": "ex-1423",
    "name": "Reverse hyper on flat bench",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1423-OrETs32.gif",
    "synergists": {
      "gluteos": 9,
      "lumbares": 8,
      "femorales": 7
    }
  },
  {
    "id": "ex-3663",
    "name": "Reverse plank with leg lift",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3663-tFToB7l.gif",
    "synergists": {
      "gluteos": 8,
      "abdominales": 7,
      "femorales": 7,
      "lumbares": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0677",
    "name": "Ring dips",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0677-ezTvXcr.gif",
    "synergists": {
      "triceps": 9,
      "pecho": 9,
      "hombros": 8,
      "abdominales": 6
    }
  },
  {
    "id": "ex-2571",
    "name": "Rocking frog stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2571-2Dk4xQV.gif",
    "synergists": {
      "aductores": 8,
      "gluteos": 5,
      "abductores": 4
    }
  },
  {
    "id": "ex-0678",
    "name": "Rocky pull-up pulldown",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0678-cQ19bBP.gif",
    "synergists": {
      "dorsales": 9,
      "espalda_alta": 8,
      "biceps": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-2208",
    "name": "Roller back stretch",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2208-isofgzg.gif",
    "synergists": {
      "lumbares": 10,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-2204",
    "name": "Roller body saw",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2204-XeMvLgE.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 3,
      "lumbares": 2
    }
  },
  {
    "id": "ex-2205",
    "name": "Roller hip lat stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2205-0L2KwtI.gif",
    "synergists": {
      "gluteos": 10,
      "dorsales": 3,
      "lumbares": 2
    }
  },
  {
    "id": "ex-2202",
    "name": "Roller hip stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2202-oMypNrz.gif",
    "synergists": {
      "gluteos": 10,
      "abductores": 3
    }
  },
  {
    "id": "ex-2206",
    "name": "Roller reverse crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2206-SKXQAx3.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 4,
      "gluteos": 3,
      "lumbar": 2
    }
  },
  {
    "id": "ex-2203",
    "name": "Roller seated shoulder flexor depresor retractor",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2203-8coXSYU.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "triceps": 5,
      "dorsales": 4,
      "espalda_alta": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-2209",
    "name": "Roller seated single leg shoulder flexor depresor retractor",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2209-CjETvlw.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "triceps": 5,
      "dorsales": 4,
      "abdominales": 4,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-2207",
    "name": "Roller side lat stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2207-c3Pfhti.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 5,
      "hombros": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0680",
    "name": "Rope climb",
    "muscle": "espalda_alta",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0680-yaAxcQr.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 9,
      "biceps": 8,
      "antebrazos": 8,
      "abdominales": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0685",
    "name": "Run",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0685-oLrKqDH.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 6,
      "femorales": 6,
      "gemelos": 6,
      "gluteos": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0684",
    "name": "Run (equipment)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0684-y5p0H8a.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 6,
      "femorales": 6,
      "gemelos": 6,
      "gluteos": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1585",
    "name": "Runners stretch",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1585-0mB6wHO.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 6,
      "gemelos": 4,
      "lumbar": 3
    }
  },
  {
    "id": "ex-0687",
    "name": "Russian twist",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0687-XVDdcoj.gif",
    "synergists": {
      "abdominales": 10,
      "lumbar": 4,
      "hombros": 2,
      "femorales": 2
    }
  },
  {
    "id": "ex-3012",
    "name": "Scapula dips",
    "muscle": "trapecios",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3012-7xeukSt.gif",
    "synergists": {
      "trapecios": 10,
      "espalda_alta": 8,
      "pecho": 5,
      "triceps": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-3021",
    "name": "Scapula push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3021-jV65tKx.gif",
    "synergists": {
      "pecho": 10,
      "espalda_alta": 7,
      "trapecios": 7,
      "hombros": 5,
      "triceps": 3,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0688",
    "name": "Scapular pull-up",
    "muscle": "trapecios",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0688-uTBt1HV.gif",
    "synergists": {
      "trapecios": 10,
      "espalda_alta": 9,
      "dorsales": 7,
      "antebrazos": 4,
      "biceps": 3
    }
  },
  {
    "id": "ex-3219",
    "name": "Scissor jumps (male)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3219-Eh2v5Iu.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 8,
      "gluteos": 7,
      "gemelos": 7,
      "femorales": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1390",
    "name": "Seated calf stretch (male)",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1390-17bqEXD.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 4
    }
  },
  {
    "id": "ex-1424",
    "name": "Seated glute stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1424-DeDThfG.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 4,
      "lumbar": 3
    }
  },
  {
    "id": "ex-0689",
    "name": "Seated leg raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0689-Hgs6Nl1.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 6,
      "lumbar": 3
    }
  },
  {
    "id": "ex-0690",
    "name": "Seated lower back stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0690-QFmz6ch.gif",
    "synergists": {
      "dorsales": 10,
      "lumbar": 8,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-2567",
    "name": "Seated piriformis stretch",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2567-QY39eBr.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 3,
      "lumbar": 2
    }
  },
  {
    "id": "ex-0691",
    "name": "Seated side crunch (wall)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0691-Y9hNPcN.gif",
    "synergists": {
      "abdominales": 10,
      "lumbar": 4
    }
  },
  {
    "id": "ex-1587",
    "name": "Seated wide angle pose sequence",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1587-HIgYKAB.gif",
    "synergists": {
      "femorales": 10,
      "aductores": 8,
      "gluteos": 5,
      "lumbar": 4
    }
  },
  {
    "id": "ex-0697",
    "name": "Self assisted inverse leg curl",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0697-GwYwElT.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 7,
      "gemelos": 5,
      "lumbar": 4
    }
  },
  {
    "id": "ex-1766",
    "name": "Self assisted inverse leg curl",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1766-ZSY3MsL.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 7,
      "gemelos": 5,
      "lumbar": 4
    }
  },
  {
    "id": "ex-0696",
    "name": "Self assisted inverse leg curl (on floor)",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0696-E4PwJqI.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 7,
      "gemelos": 5,
      "lumbar": 4
    }
  },
  {
    "id": "ex-3222",
    "name": "Semi squat jump (male)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3222-6FMU51h.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 9,
      "gluteos": 8,
      "gemelos": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-3656",
    "name": "Short stride run",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3656-CcWEoWV.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 7,
      "gemelos": 7,
      "gluteos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-1763",
    "name": "Shoulder grip pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1763-YtgD7Xq.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 8,
      "espalda_alta": 7,
      "antebrazos": 6,
      "hombros": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-3699",
    "name": "Shoulder tap",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3699-yRpV5TC.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 7,
      "triceps": 5,
      "pecho": 4,
      "lumbar": 4
    }
  },
  {
    "id": "ex-0699",
    "name": "Shoulder tap push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0699-qEse6fe.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 7
    }
  },
  {
    "id": "ex-1774",
    "name": "Side bridge hip abduction",
    "muscle": "abductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1774-WL4EmxJ.gif",
    "synergists": {
      "abductores": 10,
      "abdominales": 8,
      "gluteos": 7,
      "lumbar": 4
    }
  },
  {
    "id": "ex-0705",
    "name": "Side bridge v. 2",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0705-RKjH6Lt.gif",
    "synergists": {
      "abdominales": 10,
      "abductores": 6,
      "gluteos": 5,
      "lumbar": 5,
      "hombros": 3
    }
  },
  {
    "id": "ex-0709",
    "name": "Side hip (on parallel bars)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0709-jTkSc6o.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 6,
      "triceps": 5,
      "abductores": 5,
      "gluteos": 4
    }
  },
  {
    "id": "ex-0710",
    "name": "Side hip abduction",
    "muscle": "abductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0710-7WaDzyL.gif",
    "synergists": {
      "abductores": 10,
      "gluteos": 7,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1358",
    "name": "Side lying floor stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1358-jDOKRM5.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 5,
      "hombros": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-3667",
    "name": "Side lying hip adduction (male)",
    "muscle": "aductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3667-c8f5cSY.gif",
    "synergists": {
      "aductores": 10,
      "abdominales": 3,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-1775",
    "name": "Side plank hip adduction",
    "muscle": "aductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1775-VO2qeJg.gif",
    "synergists": {
      "aductores": 10,
      "abdominales": 8,
      "abductores": 5,
      "gluteos": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-0716",
    "name": "Side push neck stretch",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0716-oQRJYkC.gif",
    "synergists": {
      "espalda_alta": 10,
      "trapecios": 7,
      "hombros": 3
    }
  },
  {
    "id": "ex-0717",
    "name": "Side push-up",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0717-wpbD28t.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 7,
      "hombros": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0721",
    "name": "Side wrist pull stretch",
    "muscle": "antebrazos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0721-UtmIqcI.gif",
    "synergists": {
      "antebrazos": 10,
      "hombros": 3
    }
  },
  {
    "id": "ex-0720",
    "name": "Side-to-side chin",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0720-isAAZWA.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 8,
      "espalda_alta": 8,
      "antebrazos": 6,
      "hombros": 4,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3213",
    "name": "Side-to-side toe touch (male)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3213-WCAvOfC.gif",
    "synergists": {
      "abdominales": 10,
      "femorales": 5,
      "lumbar": 5,
      "gluteos": 3
    }
  },
  {
    "id": "ex-0725",
    "name": "Single arm push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0725-MUic5zN.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 8,
      "abdominales": 8,
      "lumbar": 5
    }
  },
  {
    "id": "ex-3645",
    "name": "Single leg bridge with outstretched leg",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3645-rmEukuS.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 8,
      "lumbar": 5,
      "abdominales": 4,
      "cuadriceps": 3
    }
  },
  {
    "id": "ex-0727",
    "name": "Single leg calf raise (on a dumbbell)",
    "muscle": "gemelos",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0727-fKZgDEO.gif",
    "synergists": {
      "gemelos": 10,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-0730",
    "name": "Single leg platform slide",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0730-LNE3wfo.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 8,
      "cuadriceps": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1759",
    "name": "Single leg squat (pistol) male",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1759-nqs5HGV.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1489",
    "name": "Sissy squat",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1489-xdYPUtE.gif",
    "synergists": {
      "cuadriceps": 10,
      "abdominales": 5,
      "gluteos": 3,
      "gemelos": 3
    }
  },
  {
    "id": "ex-0735",
    "name": "Sit-up v. 2",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0735-Bn6TXyO.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 4,
      "lumbar": 2
    }
  },
  {
    "id": "ex-3679",
    "name": "Sit-up with arms on chest",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3679-6ZCiYWQ.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 4,
      "lumbar": 2
    }
  },
  {
    "id": "ex-3361",
    "name": "Skater hops",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3361-zfNHMN9.gif",
    "synergists": {
      "cardio": 10,
      "gluteos": 8,
      "abductores": 8,
      "cuadriceps": 7,
      "gemelos": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-2142",
    "name": "Ski ergometer",
    "muscle": "triceps",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2142-vpQaQkH.gif",
    "synergists": {
      "triceps": 10,
      "abdominales": 8,
      "dorsales": 8,
      "hombros": 6,
      "espalda_alta": 5
    }
  },
  {
    "id": "ex-3671",
    "name": "Ski step",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3671-5MRH8H2.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 7,
      "gluteos": 6,
      "gemelos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-3304",
    "name": "Skin the cat",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3304-MSfvriJ.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 8,
      "hombros": 8,
      "abdominales": 7,
      "biceps": 6,
      "pecho": 5
    }
  },
  {
    "id": "ex-1425",
    "name": "Sled 45 degrees one leg press",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1425-WWD6FzI.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0738",
    "name": "Sled 45в° calf press",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0738-qCNVnaU.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 2
    }
  },
  {
    "id": "ex-0739",
    "name": "Sled 45в° leg press",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0739-10Z2DXU.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1464",
    "name": "Sled 45в° leg press (back pov)",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1464-yn2lLSI.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1463",
    "name": "Sled 45° leg press (side pov)",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1463-2Qh2J1e.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0740",
    "name": "Sled 45в° leg wide press",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0740-tj41Nu6.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "aductores": 8,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1391",
    "name": "Sled calf press on leg press",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1391-ykHcWme.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 2
    }
  },
  {
    "id": "ex-0741",
    "name": "Sled closer hack squat",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0741-gf3ZjB9.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0742",
    "name": "Sled forward angled calf raise",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0742-XDOiFns.gif",
    "synergists": {
      "gemelos": 10,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-0743",
    "name": "Sled hack squat",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0743-Qa55kX1.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-2334",
    "name": "Sled lying calf press",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2334-g376LuL.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 2
    }
  },
  {
    "id": "ex-0744",
    "name": "Sled lying squat",
    "muscle": "gluteos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0744-9n2149Z.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1392",
    "name": "Sled one leg calf press on leg press",
    "muscle": "gemelos",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1392-u0pLNgz.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 2
    }
  },
  {
    "id": "ex-1496",
    "name": "Sledge hammer",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1496-REXmfVC.gif",
    "synergists": {
      "abdominales": 10,
      "espalda_alta": 7,
      "hombros": 7,
      "antebrazos": 6,
      "triceps": 6,
      "dorsales": 6
    }
  },
  {
    "id": "ex-0746",
    "name": "Smith back shrug",
    "muscle": "trapecios",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0746-MzNnwx9.gif",
    "synergists": {
      "trapecios": 10,
      "espalda_alta": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0747",
    "name": "Smith behind neck press",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0747-Gpn4ADc.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "trapecios": 6,
      "pecho": 4
    }
  },
  {
    "id": "ex-0748",
    "name": "Smith bench press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0748-trqKQv2.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 7,
      "hombros": 7
    }
  },
  {
    "id": "ex-0749",
    "name": "Smith bent knee good morning",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0749-1bQkKZK.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 8,
      "lumbar": 8,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1359",
    "name": "Smith bent over row",
    "muscle": "espalda_alta",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1359-ZX9UZmj.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 8,
      "biceps": 6,
      "hombros": 5,
      "lumbar": 4,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0750",
    "name": "Smith chair squat",
    "muscle": "cuadriceps",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0750-Gu2rNJd.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "femorales": 5
    }
  },
  {
    "id": "ex-0751",
    "name": "Smith close-grip bench press",
    "muscle": "triceps",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0751-WcHl7ru.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 7,
      "hombros": 6
    }
  },
  {
    "id": "ex-0752",
    "name": "Smith deadlift",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0752-UfePqpx.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 8,
      "lumbar": 8,
      "cuadriceps": 7,
      "trapecios": 5,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0753",
    "name": "Smith decline bench press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0753-ETZfAbZ.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-0754",
    "name": "Smith decline reverse-grip press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0754-MY9P1WA.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 5,
      "biceps": 3
    }
  },
  {
    "id": "ex-1433",
    "name": "Smith front squat (clean grip)",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1433-lFhb2Rw.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-3281",
    "name": "Smith full squat",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3281-NNoHCEA.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 7,
      "lumbar": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-0755",
    "name": "Smith hack squat",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0755-ZuPXtCK.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-0756",
    "name": "Smith hip raise",
    "muscle": "abdominales",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0756-CqhoytW.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 4,
      "gluteos": 3
    }
  },
  {
    "id": "ex-0757",
    "name": "Smith incline bench press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0757-5v7KYld.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 8,
      "triceps": 7
    }
  },
  {
    "id": "ex-0758",
    "name": "Smith incline reverse-grip press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0758-78VqWQK.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 7,
      "biceps": 3
    }
  },
  {
    "id": "ex-0759",
    "name": "Smith incline shoulder raises",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0759-ayAHcEm.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "trapecios": 5,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0760",
    "name": "Smith leg press",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0760-7zdxRTl.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1434",
    "name": "Smith low bar squat",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1434-RGLscZM.gif",
    "synergists": {
      "gluteos": 10,
      "femorales": 8,
      "cuadriceps": 8,
      "lumbar": 6,
      "abdominales": 4
    }
  },
  {
    "id": "ex-1683",
    "name": "Smith machine bicep curl",
    "muscle": "biceps",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1683-zILLZ98.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6,
      "hombros": 3
    }
  },
  {
    "id": "ex-1625",
    "name": "Smith machine decline close grip bench press",
    "muscle": "triceps",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1625-yB9SvIF.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 7,
      "hombros": 5
    }
  },
  {
    "id": "ex-1752",
    "name": "Smith machine incline tricep extension",
    "muscle": "triceps",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1752-o8aOcrz.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 4,
      "hombros": 4
    }
  },
  {
    "id": "ex-1626",
    "name": "Smith machine reverse decline close grip bench press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1626-QyO6Uma.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 5
    }
  },
  {
    "id": "ex-0761",
    "name": "Smith narrow row",
    "muscle": "espalda_alta",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0761-JGKowMS.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 8,
      "biceps": 6,
      "hombros": 5,
      "lumbar": 4
    }
  },
  {
    "id": "ex-1360",
    "name": "Smith one arm row",
    "muscle": "espalda_alta",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1360-Q4DSJPC.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 8,
      "biceps": 6,
      "hombros": 5,
      "lumbar": 3
    }
  },
  {
    "id": "ex-1393",
    "name": "Smith one leg floor calf raise",
    "muscle": "gemelos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1393-9GXrTE6.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 2
    }
  },
  {
    "id": "ex-0762",
    "name": "Smith rear delt row",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0762-nFUwqG6.gif",
    "synergists": {
      "hombros": 10,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 5
    }
  },
  {
    "id": "ex-0763",
    "name": "Smith reverse calf raises",
    "muscle": "gemelos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0763-ywaNfuh.gif",
    "synergists": {
      "gemelos": 10,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-1394",
    "name": "Smith reverse calf raises",
    "muscle": "gemelos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1394-Lsqrgh4.gif",
    "synergists": {
      "gemelos": 10,
      "cuadriceps": 2
    }
  },
  {
    "id": "ex-1361",
    "name": "Smith reverse grip bent over row",
    "muscle": "espalda_alta",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1361-aaxA3cm.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 8,
      "biceps": 7,
      "hombros": 5,
      "lumbar": 4
    }
  },
  {
    "id": "ex-0764",
    "name": "Smith reverse-grip press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0764-zK8Fu1W.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 6,
      "biceps": 3
    }
  },
  {
    "id": "ex-1395",
    "name": "Smith seated one leg calf raise",
    "muscle": "gemelos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1395-0S75mYG.gif",
    "synergists": {
      "gemelos": 10,
      "femorales": 2
    }
  },
  {
    "id": "ex-0765",
    "name": "Smith seated shoulder press",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0765-xUwnBMT.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "trapecios": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-1426",
    "name": "Smith seated wrist curl",
    "muscle": "antebrazos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1426-B6dAO1t.gif",
    "synergists": {
      "antebrazos": 10,
      "biceps": 2
    }
  },
  {
    "id": "ex-0766",
    "name": "Smith shoulder press",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0766-903mzG8.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "trapecios": 5,
      "pecho": 3
    }
  },
  {
    "id": "ex-0767",
    "name": "Smith shrug",
    "muscle": "trapecios",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0767-OUQ0ZyW.gif",
    "synergists": {
      "trapecios": 10,
      "espalda_alta": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0768",
    "name": "Smith single leg split squat",
    "muscle": "cuadriceps",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0768-wWFspEi.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "femorales": 5,
      "aductores": 4
    }
  },
  {
    "id": "ex-0769",
    "name": "Smith sprint lunge",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0769-HsjbB1z.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "femorales": 6,
      "gemelos": 3
    }
  },
  {
    "id": "ex-0770",
    "name": "Smith squat",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0770-jFtipLl.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "lumbares": 4
    }
  },
  {
    "id": "ex-0771",
    "name": "Smith standing back wrist curl",
    "muscle": "antebrazos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0771-hfmQ0Tz.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0772",
    "name": "Smith standing behind head military press",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0772-ht8xDrP.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "trapecios": 6,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0773",
    "name": "Smith standing leg calf raise",
    "muscle": "gemelos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0773-6MaEjVA.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0774",
    "name": "Smith standing military press",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0774-jjUPrze.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "trapecios": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-3142",
    "name": "Smith sumo squat",
    "muscle": "gluteos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3142-dzz6BiV.gif",
    "synergists": {
      "gluteos": 10,
      "aductores": 8,
      "cuadriceps": 7,
      "femorales": 5
    }
  },
  {
    "id": "ex-1396",
    "name": "Smith toe raise",
    "muscle": "gemelos",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1396-Y4QlY8z.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-0775",
    "name": "Smith upright row",
    "muscle": "hombros",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0775-1DN3iz4.gif",
    "synergists": {
      "hombros": 10,
      "trapecios": 8,
      "biceps": 5,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1308",
    "name": "Smith wide grip bench press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1308-zoOvPcx.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 6,
      "triceps": 5
    }
  },
  {
    "id": "ex-1309",
    "name": "Smith wide grip decline bench press",
    "muscle": "pecho",
    "equipment": "multipower",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1309-wi2H9QX.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 5,
      "triceps": 4
    }
  },
  {
    "id": "ex-0776",
    "name": "Snatch pull",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0776-dG5Smob.gif",
    "synergists": {
      "cuadriceps": 10,
      "trapecios": 8,
      "gluteos": 8,
      "femorales": 7,
      "lumbares": 7,
      "espalda_alta": 6
    }
  },
  {
    "id": "ex-0777",
    "name": "Spell caster",
    "muscle": "abdominales",
    "equipment": "mancuernas",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0777-p9cCe2r.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 6,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1362",
    "name": "Sphinx",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1362-DIVyqrU.gif",
    "synergists": {
      "lumbares": 10,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-0778",
    "name": "Spider crawl push up",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0778-P9GFBME.gif",
    "synergists": {
      "gluteos": 10,
      "pecho": 8,
      "hombros": 6,
      "triceps": 5,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1363",
    "name": "Spine stretch",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1363-JbC2iaV.gif",
    "synergists": {
      "lumbares": 10,
      "femorales": 5
    }
  },
  {
    "id": "ex-2329",
    "name": "Spine twist",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2329-2jl9K55.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 4
    }
  },
  {
    "id": "ex-2368",
    "name": "Split squats",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2368-9E25EOx.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "femorales": 5
    }
  },
  {
    "id": "ex-0786",
    "name": "Squat jerk",
    "muscle": "cuadriceps",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0786-IMRsOCn.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "hombros": 8,
      "triceps": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1705",
    "name": "Squat on bosu ball",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1705-T2fA5Ir.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "abdominales": 5,
      "gemelos": 4
    }
  },
  {
    "id": "ex-1685",
    "name": "Squat to overhead reach",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1685-QChZi3x.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "hombros": 6
    }
  },
  {
    "id": "ex-1686",
    "name": "Squat to overhead reach with twist",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1686-5BZHW9s.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "abdominales": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-2297",
    "name": "Stability ball crunch (full range hands behind head)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2297-Gn5FwYT.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3291",
    "name": "Stalder press",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3291-zd4P4B2.gif",
    "synergists": {
      "triceps": 10,
      "abdominales": 9,
      "hombros": 8,
      "pecho": 4
    }
  },
  {
    "id": "ex-3669",
    "name": "Standing archer",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3669-JF8AkMX.gif",
    "synergists": {
      "espalda_alta": 10,
      "hombros": 7,
      "dorsales": 6,
      "biceps": 4
    }
  },
  {
    "id": "ex-0788",
    "name": "Standing behind neck press",
    "muscle": "hombros",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0788-xDh0lJr.gif",
    "synergists": {
      "hombros": 10,
      "triceps": 7,
      "trapecios": 6,
      "espalda_alta": 4
    }
  },
  {
    "id": "ex-1490",
    "name": "Standing calf raise (on a staircase)",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1490-6HmFgmx.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1397",
    "name": "Standing calves",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1397-XIHEoCG.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1398",
    "name": "Standing calves calf stretch",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1398-qOKcgVP.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1599",
    "name": "Standing hamstring and calf stretch with strap",
    "muscle": "femorales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1599-xTjr103.gif",
    "synergists": {
      "femorales": 10,
      "gemelos": 6
    }
  },
  {
    "id": "ex-0794",
    "name": "Standing lateral stretch",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0794-1jXLYEw.gif",
    "synergists": {
      "dorsales": 10,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1364",
    "name": "Standing pelvic tilt",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1364-cuKYxhu.gif",
    "synergists": {
      "lumbares": 10,
      "abdominales": 6,
      "gluteos": 5
    }
  },
  {
    "id": "ex-0795",
    "name": "Standing single leg curl",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0795-C5jncD2.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 4,
      "gemelos": 3
    }
  },
  {
    "id": "ex-0796",
    "name": "Standing wheel rollerout",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0796-KtRomty.gif",
    "synergists": {
      "abdominales": 10,
      "dorsales": 6,
      "hombros": 5,
      "pecho": 4,
      "lumbares": 4
    }
  },
  {
    "id": "ex-3223",
    "name": "Star jump (male)",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3223-HtfCpfi.gif",
    "synergists": {
      "cardio": 10,
      "gemelos": 6,
      "cuadriceps": 5,
      "gluteos": 5
    }
  },
  {
    "id": "ex-2138",
    "name": "Stationary bike run v. 3",
    "muscle": "cardio",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2138-H1PESYI.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 7,
      "gemelos": 5,
      "femorales": 4
    }
  },
  {
    "id": "ex-0798",
    "name": "Stationary bike walk",
    "muscle": "cardio",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0798-a8VDgLw.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-3314",
    "name": "Straddle maltese",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3314-HfqciZF.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 9,
      "pecho": 7,
      "triceps": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-3298",
    "name": "Straddle planche",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3298-BL3GHeY.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 9,
      "pecho": 6,
      "triceps": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-1427",
    "name": "Straight leg outer hip abductor",
    "muscle": "abductores",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1427-mQ1tBXn.gif",
    "synergists": {
      "abductores": 10,
      "gluteos": 6
    }
  },
  {
    "id": "ex-0803",
    "name": "Superman push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0803-4GqRrAk.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 6,
      "lumbares": 5
    }
  },
  {
    "id": "ex-0805",
    "name": "Suspended abdominal fallout",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0805-X3TCNEU.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 6,
      "triceps": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-0806",
    "name": "Suspended push-up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0806-IaGQCrC.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "triceps": 7,
      "abdominales": 6
    }
  },
  {
    "id": "ex-0807",
    "name": "Suspended reverse crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0807-R1WYG5D.gif",
    "synergists": {
      "abdominales": 10,
      "hombros": 5
    }
  },
  {
    "id": "ex-0808",
    "name": "Suspended row",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0808-4OaumBr.gif",
    "synergists": {
      "espalda_alta": 10,
      "dorsales": 8,
      "biceps": 6,
      "abdominales": 5
    }
  },
  {
    "id": "ex-0809",
    "name": "Suspended split squat",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0809-QpXqiq8.gif",
    "synergists": {
      "cuadriceps": 10,
      "gluteos": 8,
      "femorales": 5,
      "abdominales": 4
    }
  },
  {
    "id": "ex-3433",
    "name": "Swimmer kicks v. 2 (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3433-SP3hUez.gif",
    "synergists": {
      "gluteos": 10,
      "lumbares": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-3318",
    "name": "Swing 360",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3318-tnaj0mT.gif",
    "synergists": {
      "cardio": 10,
      "hombros": 7,
      "abdominales": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-1753",
    "name": "Three bench dip",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1753-DQ0cqkT.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 6
    }
  },
  {
    "id": "ex-2459",
    "name": "Tire flip",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2459-oZjMu1t.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "femorales": 7,
      "lumbares": 7,
      "trapecios": 6,
      "hombros": 5
    }
  },
  {
    "id": "ex-0811",
    "name": "Trap bar deadlift",
    "muscle": "gluteos",
    "equipment": "barra",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0811-jQGwmxN.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "femorales": 8,
      "lumbares": 7,
      "trapecios": 6,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0814",
    "name": "Triceps dip",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0814-X6C6i5Y.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 7,
      "pecho": 6
    }
  },
  {
    "id": "ex-0812",
    "name": "Triceps dip (bench leg)",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0812-VuoerH0.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 6,
      "pecho": 5
    }
  },
  {
    "id": "ex-0813",
    "name": "Triceps dip (between benches)",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0813-Wgbn9qo.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 6,
      "pecho": 5
    }
  },
  {
    "id": "ex-0815",
    "name": "Triceps dips floor",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0815-7aVz15j.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 5,
      "pecho": 4
    }
  },
  {
    "id": "ex-0816",
    "name": "Triceps press",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0816-fSrPP6B.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 5
    }
  },
  {
    "id": "ex-0817",
    "name": "Triceps stretch",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0817-uOV3Itw.gif",
    "synergists": {
      "triceps": 10
    }
  },
  {
    "id": "ex-0871",
    "name": "Tuck crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0871-BMMolZ3.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0818",
    "name": "Twin handle parallel grip lat pulldown",
    "muscle": "dorsales",
    "equipment": "polea",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0818-rkg41Fb.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 7,
      "biceps": 6,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1466",
    "name": "Twist hip lift",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1466-AX1kB0o.gif",
    "synergists": {
      "gluteos": 10,
      "abdominales": 8,
      "lumbares": 5
    }
  },
  {
    "id": "ex-2802",
    "name": "Twisted leg raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2802-C0eCeEt.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-2801",
    "name": "Twisted leg raise (female)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2801-yT9tk17.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3231",
    "name": "Two toe touch (male)",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3231-p195zsJ.gif",
    "synergists": {
      "lumbares": 10,
      "femorales": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-1365",
    "name": "Upper back stretch",
    "muscle": "espalda_alta",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1365-GSDioYu.gif",
    "synergists": {
      "espalda_alta": 10,
      "trapecios": 6
    }
  },
  {
    "id": "ex-1366",
    "name": "Upward facing dog",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1366-01qpYSe.gif",
    "synergists": {
      "lumbares": 10,
      "abdominales": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-3420",
    "name": "V-sit on floor",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3420-ZuXu4Eq.gif",
    "synergists": {
      "abdominales": 10,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-0826",
    "name": "Vertical leg raise (on parallel bars)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0826-ZNgOYQU.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-2141",
    "name": "Walk elliptical cross trainer",
    "muscle": "cardio",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2141-rjtuP6X.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 6,
      "gemelos": 5,
      "femorales": 4
    }
  },
  {
    "id": "ex-3655",
    "name": "Walking high knees lunge",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3655-J9zIWig.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 8,
      "gluteos": 7,
      "femorales": 5
    }
  },
  {
    "id": "ex-1460",
    "name": "Walking lunge",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1460-IZVHb27.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "femorales": 6,
      "gemelos": 4
    }
  },
  {
    "id": "ex-3666",
    "name": "Walking on incline treadmill",
    "muscle": "cardio",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3666-rjiM4L3.gif",
    "synergists": {
      "cardio": 10,
      "gemelos": 7,
      "gluteos": 6,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-2311",
    "name": "Walking on stepmill",
    "muscle": "cardio",
    "equipment": "maquina",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2311-j9Q5crt.gif",
    "synergists": {
      "cardio": 10,
      "gluteos": 7,
      "gemelos": 7,
      "cuadriceps": 6
    }
  },
  {
    "id": "ex-0830",
    "name": "Weighted bench dip",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0830-MU9HnE7.gif",
    "synergists": {
      "triceps": 10,
      "hombros": 6,
      "pecho": 5
    }
  },
  {
    "id": "ex-2987",
    "name": "Weighted close grip chin-up on dip cage",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2987-Gk1r408.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 8,
      "espalda_alta": 7,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-3643",
    "name": "Weighted cossack squats (male)",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3643-GWoKnIm.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "aductores": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-0832",
    "name": "Weighted crunch",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0832-s8nrDXF.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-3670",
    "name": "Weighted decline sit-up",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3670-EZeDVzO.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0833",
    "name": "Weighted donkey calf raise",
    "muscle": "gemelos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0833-LmaFNZS.gif",
    "synergists": {
      "gemelos": 10
    }
  },
  {
    "id": "ex-1310",
    "name": "Weighted drop push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1310-PSlvNMs.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 7,
      "triceps": 7,
      "abdominales": 5
    }
  },
  {
    "id": "ex-2135",
    "name": "Weighted front plank",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2135-VBAWRPG.gif",
    "synergists": {
      "abdominales": 10,
      "lumbares": 5,
      "hombros": 4
    }
  },
  {
    "id": "ex-0834",
    "name": "Weighted front raise",
    "muscle": "hombros",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0834-e4aFmFY.gif",
    "synergists": {
      "hombros": 10,
      "pecho": 4,
      "trapecios": 3
    }
  },
  {
    "id": "ex-0866",
    "name": "Weighted hanging leg-hip raise",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0866-QOA0FD0.gif",
    "synergists": {
      "abdominales": 10,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-0835",
    "name": "Weighted hyperextension (on stability ball)",
    "muscle": "lumbares",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0835-8urJS9b.gif",
    "synergists": {
      "lumbares": 10,
      "gluteos": 7,
      "femorales": 6
    }
  },
  {
    "id": "ex-3641",
    "name": "Weighted kneeling step with swing",
    "muscle": "hombros",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3641-7uFJuXp.gif",
    "synergists": {
      "hombros": 10,
      "gluteos": 7,
      "abdominales": 6,
      "cuadriceps": 5
    }
  },
  {
    "id": "ex-3644",
    "name": "Weighted lunge with swing",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3644-5WiFcYk.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "hombros": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-3286",
    "name": "Weighted muscle up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3286-JsOV1SU.gif",
    "synergists": {
      "dorsales": 10,
      "triceps": 8,
      "pecho": 7,
      "espalda_alta": 7,
      "hombros": 6,
      "biceps": 6
    }
  },
  {
    "id": "ex-3312",
    "name": "Weighted muscle up (on bar)",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3312-MCkqdKE.gif",
    "synergists": {
      "dorsales": 10,
      "triceps": 8,
      "pecho": 7,
      "espalda_alta": 7,
      "hombros": 6,
      "biceps": 6
    }
  },
  {
    "id": "ex-3290",
    "name": "Weighted one hand pull up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3290-fXfqg1E.gif",
    "synergists": {
      "dorsales": 10,
      "biceps": 8,
      "espalda_alta": 7,
      "antebrazos": 6
    }
  },
  {
    "id": "ex-0840",
    "name": "Weighted overhead crunch (on stability ball)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0840-xmM75XG.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0841",
    "name": "Weighted pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0841-HMzLjXx.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 8,
      "biceps": 7,
      "antebrazos": 5
    }
  },
  {
    "id": "ex-0844",
    "name": "Weighted round arm",
    "muscle": "hombros",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0844-VLYXo8S.gif",
    "synergists": {
      "hombros": 10,
      "pecho": 5
    }
  },
  {
    "id": "ex-0846",
    "name": "Weighted russian twist",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0846-fZFZ704.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0845",
    "name": "Weighted russian twist (legs up)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0845-WU9BLIs.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-2371",
    "name": "Weighted russian twist v. 2",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2371-YIUAtYf.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0847",
    "name": "Weighted seated bicep curl (on stability ball)",
    "muscle": "biceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0847-b4b6afT.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0849",
    "name": "Weighted seated twist (on stability ball)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0849-s34Y4LR.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0850",
    "name": "Weighted side bend (on stability ball)",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0850-6bOA1Oi.gif",
    "synergists": {
      "abdominales": 10
    }
  },
  {
    "id": "ex-0851",
    "name": "Weighted sissy squat",
    "muscle": "cuadriceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0851-0lQnxMZ.gif",
    "synergists": {
      "cuadriceps": 10,
      "abdominales": 4,
      "gluteos": 3,
      "femorales": 2
    }
  },
  {
    "id": "ex-0852",
    "name": "Weighted squat",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0852-JZuApnB.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 9,
      "aductores": 5,
      "lumbares": 5,
      "femorales": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0853",
    "name": "Weighted standing curl",
    "muscle": "biceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0853-M5Y7GPg.gif",
    "synergists": {
      "biceps": 10,
      "antebrazos": 6,
      "hombros": 3,
      "abdominales": 2
    }
  },
  {
    "id": "ex-0854",
    "name": "Weighted standing hand squeeze",
    "muscle": "antebrazos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0854-bjqbauy.gif",
    "synergists": {
      "antebrazos": 10,
      "biceps": 2
    }
  },
  {
    "id": "ex-3313",
    "name": "Weighted straight bar dip",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3313-Ff18ItA.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 8,
      "hombros": 7,
      "abdominales": 3
    }
  },
  {
    "id": "ex-3642",
    "name": "Weighted stretch lunge",
    "muscle": "gluteos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3642-13VW2VO.gif",
    "synergists": {
      "gluteos": 10,
      "cuadriceps": 8,
      "femorales": 6,
      "aductores": 4,
      "gemelos": 3,
      "abdominales": 2
    }
  },
  {
    "id": "ex-0856",
    "name": "Weighted svend press",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0856-I1OBLnn.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 5,
      "triceps": 4,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-1754",
    "name": "Weighted three bench dips",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1754-gtO1ErP.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 6,
      "abdominales": 2
    }
  },
  {
    "id": "ex-1755",
    "name": "Weighted tricep dips",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1755-bZq4bwK.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 6,
      "abdominales": 2
    }
  },
  {
    "id": "ex-1767",
    "name": "Weighted triceps dip on high parallel bars",
    "muscle": "triceps",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1767-K1vlode.gif",
    "synergists": {
      "triceps": 10,
      "pecho": 6,
      "hombros": 6,
      "abdominales": 2
    }
  },
  {
    "id": "ex-0857",
    "name": "Wheel rollerout",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0857-NAgVB3t.gif",
    "synergists": {
      "abdominales": 10,
      "dorsales": 6,
      "pecho": 4,
      "hombros": 4,
      "lumbares": 3,
      "antebrazos": 3
    }
  },
  {
    "id": "ex-3637",
    "name": "Wheel run",
    "muscle": "cardio",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/3637-km2Ljzj.gif",
    "synergists": {
      "cardio": 10,
      "cuadriceps": 7,
      "gemelos": 6,
      "gluteos": 5,
      "femorales": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1429",
    "name": "Wide grip pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1429-Qqi7bko.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 8,
      "biceps": 6,
      "trapecios": 5,
      "hombros": 4,
      "antebrazos": 4,
      "abdominales": 2
    }
  },
  {
    "id": "ex-1367",
    "name": "Wide grip rear pull-up",
    "muscle": "dorsales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1367-OYFhXVD.gif",
    "synergists": {
      "dorsales": 10,
      "espalda_alta": 8,
      "trapecios": 6,
      "biceps": 5,
      "hombros": 5,
      "antebrazos": 4
    }
  },
  {
    "id": "ex-1311",
    "name": "Wide hand push up",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1311-JmMVpR3.gif",
    "synergists": {
      "pecho": 10,
      "hombros": 6,
      "triceps": 5,
      "abdominales": 3
    }
  },
  {
    "id": "ex-2363",
    "name": "Wide-grip chest dip on high parallel bars",
    "muscle": "pecho",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/2363-O2K9Vb5.gif",
    "synergists": {
      "pecho": 10,
      "triceps": 7,
      "hombros": 7,
      "abdominales": 3
    }
  },
  {
    "id": "ex-0858",
    "name": "Wind sprints",
    "muscle": "abdominales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0858-Qoujh3Q.gif",
    "synergists": {
      "abdominales": 10,
      "cardio": 9,
      "cuadriceps": 7,
      "gemelos": 6,
      "gluteos": 6,
      "femorales": 5
    }
  },
  {
    "id": "ex-1604",
    "name": "World greatest stretch",
    "muscle": "femorales",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1604-DFGXwZr.gif",
    "synergists": {
      "femorales": 10,
      "gluteos": 6,
      "aductores": 6,
      "cuadriceps": 5,
      "lumbares": 4,
      "abdominales": 3
    }
  },
  {
    "id": "ex-1428",
    "name": "Wrist circles",
    "muscle": "antebrazos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1428-2zNKRUB.gif",
    "synergists": {
      "antebrazos": 10
    }
  },
  {
    "id": "ex-0859",
    "name": "Wrist rollerer",
    "muscle": "antebrazos",
    "equipment": "peso corporal",
    "gifUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0859-bd5b860.gif",
    "synergists": {
      "antebrazos": 10,
      "hombros": 3,
      "biceps": 2
    }
  }
];

export function getExerciseMap(custom: Exercise[] = []) {
  const map = new Map<string, Exercise>();
  for (const ex of EXERCISE_CATALOG) map.set(ex.id, ex);
  for (const ex of custom) map.set(ex.id, ex);
  return map;
}
